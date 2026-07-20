import chalk from 'chalk';
import Table from 'cli-table3';

const STATUS_COLORS: Record<string, (s: string) => string> = {
  wishlist: chalk.gray,
  applied: chalk.blue,
  phone_screen: chalk.cyan,
  interview: chalk.yellow,
  offer: chalk.green,
  accepted: chalk.greenBright,
  rejected: chalk.red,
};

export function colorStatus(status: string): string {
  const fn = STATUS_COLORS[status] ?? chalk.white;
  return fn(status.replace('_', ' '));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return chalk.gray('—');
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function makeTable(head: string[], colWidths?: number[]): Table.Table {
  return new Table({
    head: head.map((h) => chalk.bold(h)),
    style: { head: [], border: [] },
    ...(colWidths ? { colWidths } : {}),
  });
}

export function printDetail(label: string, value: string | null | undefined): void {
  if (!value) return;
  console.log(`  ${chalk.bold(label.padEnd(16))} ${value}`);
}
