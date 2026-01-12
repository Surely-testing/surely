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

// Cloudinary OG image with transformations for optimal delivery
const cloudinaryBaseUrl = "https://res.cloudinary.com/lordefid/image/upload";
const ogImageTransformations = "w_1200,h_630,c_fill,f_auto,q_auto,dpr_2.0";
const ogImagePath = "v1768234925/surely-og_image_yrrga1.png";
const ogImage = process.env.NEXT_PUBLIC_CLOUDINARY_OG_IMAGE || 
  `${cloudinaryBaseUrl}/${ogImageTransformations}/${ogImagePath}`;

// Ensure absolute URL for OG image
const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

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
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Surely - Quality Assurance Reimagined",
        type: "image/png", // Specify image type
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Surely - AI-Powered Quality Assurance Platform",
    description:
      "Transform your testing workflow with AI-powered automation, intelligent bug tracking, and real-time insights.",
    images: [ogImageUrl],
    creator: "@surely_app",
    site: "@surely_app",
  },

  // Additional metadata for better compatibility
  other: {
    // WhatsApp & Telegram compatibility
    "og:image:secure_url": ogImageUrl,
    "og:image:type": "image/png",
    "og:image:width": "1200",
    "og:image:height": "630",
    
    // Additional Twitter metadata
    "twitter:image:alt": "Surely - Quality Assurance Reimagined",
    
    // Generic fallbacks
    "image": ogImageUrl,
    "thumbnail": ogImageUrl,
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
        
        {/* Additional meta tags for maximum compatibility */}
        <meta property="og:image:secure_url" content={ogImageUrl} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Surely - Quality Assurance Reimagined" />
        
        {/* WhatsApp specific (uses OpenGraph but can be picky) */}
        <meta property="og:site_name" content="Surely" />
        
        {/* Generic fallbacks for messaging apps */}
        <meta name="thumbnail" content={ogImageUrl} />
        <link rel="image_src" href={ogImageUrl} />
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