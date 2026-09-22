export function toMinorUnits(amount: number): number {
  if (isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

export function toMajorUnits(minorAmount: number): number {
  if (isNaN(minorAmount)) return 0;
  return minorAmount / 100;
}

export function formatCurrency(
  minorAmount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string {
  const major = toMajorUnits(minorAmount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}
