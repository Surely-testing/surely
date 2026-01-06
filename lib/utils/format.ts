// lib/utils/format.ts
export function formatPrice(priceInCents: number | null): string {
  if (priceInCents === null) return 'Free';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceInCents / 100);
}

export function formatPriceSimple(priceInCents: number | null): string {
  if (priceInCents === null) return '0';
  return (priceInCents / 100).toFixed(2);
}