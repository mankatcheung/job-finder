export function formatSalary(amount: number, currency: string, period?: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
  if (!period) return formatted;
  const suffix: Record<string, string> = { yearly: '/yr', monthly: '/mo', weekly: '/wk' };
  return `${formatted}${suffix[period] ?? '/hr'}`;
}
