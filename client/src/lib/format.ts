/**
 * Currency & number formatting helpers. The app defaults to INR (₹) with the
 * Indian numbering system (lakhs/crores grouping).
 */

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  return INR_FORMATTER.format(amount);
}
