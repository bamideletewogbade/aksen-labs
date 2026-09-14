export const currencies = ['NGN', 'GHS', 'USD', 'GBP', 'EUR'] as const;
export type Line = { description: string; quantity: number; unitMinor: number };
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function minorUnits(value: unknown): number {
  if (typeof value !== 'string' || !/^\d{1,8}(\.\d{1,2})?$/.test(value.trim()))
    throw new Error('Enter a positive amount with at most two decimal places.');
  const [whole, decimal = ''] = value.trim().split('.');
  const result = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result > 2_000_000_000)
    throw new Error('Amount exceeds the supported limit.');
  return result;
}
export function calculateLines(value: unknown): {
  lines: Line[];
  total: number;
} {
  if (!Array.isArray(value) || !value.length || value.length > 30)
    throw new Error('Add between 1 and 30 line items.');
  const lines = value.map((line) => {
    if (!line || typeof line !== 'object')
      throw new Error('Invalid line item.');
    const description =
      typeof line.description === 'string'
        ? line.description.trim().slice(0, 240)
        : '';
    const quantity = Number(line.quantity);
    const unitMinor = minorUnits(line.unitPrice);
    if (
      !description ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10000
    )
      throw new Error(
        'Each item needs a description and a whole quantity from 1 to 10,000.',
      );
    return { description, quantity, unitMinor };
  });
  const total = lines.reduce(
    (sum, item) => sum + item.quantity * item.unitMinor,
    0,
  );
  if (!Number.isSafeInteger(total) || total <= 0 || total > 2_000_000_000)
    throw new Error('Total must be positive and within the supported limit.');
  return { lines, total };
}
/** narrowSymbol gives ₦ and GH₵ rather than the "NGN"/"GHS" codes the default picks. */
export function money(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).format(minor / 100);
  } catch {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(
      minor / 100,
    );
  }
}
