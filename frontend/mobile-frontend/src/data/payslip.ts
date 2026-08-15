// Placeholder data — swap for real API calls (payroll-service) once that endpoint exists.

export const PAYSLIP_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

export function fmtVND(n: number) {
  const abs = Math.abs(n);
  return (n < 0 ? '-' : '') + '₫' + abs.toLocaleString('en-US');
}

export type PayItem = { label: string; amount: number; ded?: boolean };
export const PAYSLIP: Record<string, { gross: number; ded: number; net: number; items: PayItem[] }> = {
  Jun: {
    gross: 15500000,
    ded: 2700000,
    net: 12800000,
    items: [
      { label: 'Base Salary', amount: 10000000 },
      { label: 'Overtime Pay (12h)', amount: 1200000 },
      { label: 'Meal Allowance', amount: 600000 },
      { label: 'Transportation', amount: 700000 },
      { label: 'Performance Bonus', amount: 1000000 },
      { label: 'Social Insurance (8%)', amount: -800000, ded: true },
      { label: 'Health Insurance (1.5%)', amount: -150000, ded: true },
      { label: 'Unemployment Ins. (1%)', amount: -100000, ded: true },
      { label: 'Personal Income Tax', amount: -1650000, ded: true },
    ],
  },
  May: {
    gross: 14800000,
    ded: 2550000,
    net: 12250000,
    items: [
      { label: 'Base Salary', amount: 10000000 },
      { label: 'Overtime Pay (8h)', amount: 800000 },
      { label: 'Meal Allowance', amount: 600000 },
      { label: 'Transportation', amount: 700000 },
      { label: 'Attendance Bonus', amount: 700000 },
      { label: 'Social Insurance (8%)', amount: -800000, ded: true },
      { label: 'Health Insurance (1.5%)', amount: -150000, ded: true },
      { label: 'Unemployment Ins. (1%)', amount: -100000, ded: true },
      { label: 'Personal Income Tax', amount: -1500000, ded: true },
    ],
  },
};
