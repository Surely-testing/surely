import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { GlobalThemeProvider } from "@/providers/GlobalThemeProvider";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Base configuration
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://testsurely.com";
const logoUrl = process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_URL || "/logo.svg";
const ogImage = process.env.NEXT_PUBLIC_CLOUDINARY_OG_IMAGE || logoUrl;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  
  title: {
    default: "Surely - AI-Powered Quality Assurance Platform",
    template: "%s | Surely",
  },
  description:
    "Transform your testing workflow with AI-powered automation, intelligent bug tracking, and real-time insights. Join thousands of teams shipping better software faster.",
  
  keywords: [
    "quality assurance",
    "QA automation",
    "test management",
    "bug tracking",
    "AI testing",
    "software testing",
    "test automation",
    "QA platform",
    "test case management",
    "regression testing",
  ],
  
  authors: [{ name: "Surely Team" }],
  creator: "Surely",
  publisher: "Surely",
  
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    title: "Surely - AI-Powered Quality Assurance Platform",
    description:
      "Transform your testing workflow with AI-powered automation, intelligent bug tracking, and real-time insights.",
    siteName: "Surely",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Surely - Quality Assurance Reimagined",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Surely - AI-Powered Quality Assurance Platform",
    description:
      "Transform your testing workflow with AI-powered automation, intelligent bug tracking, and real-time insights.",
    images: [ogImage],
    creator: "@surely_app",
    site: "@surely_app",
  },

  icons: {
    icon: [
      { url: logoUrl, sizes: "32x32", type: "image/png" },
      { url: logoUrl, sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: logoUrl, sizes: "180x180", type: "image/png" }],
    shortcut: [logoUrl],
  },

  manifest: "/manifest.json",
  
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash - loads theme before page renders */}
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('surely-theme') || 'system';
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const appliedTheme = theme === 'system' ? systemTheme : theme;
                
                if (appliedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <GlobalThemeProvider>
          <SupabaseProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </SupabaseProvider>
        </GlobalThemeProvider>
      </body>
    </html>
  );
}