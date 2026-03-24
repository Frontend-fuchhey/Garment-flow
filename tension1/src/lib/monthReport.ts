/**
 * Helpers for monthly reports: available months and filtering by month/year.
 */

export interface MonthYear {
  year: number;
  month: number; // 0-indexed (0 = January)
}

function toMonthYear(date: Date): MonthYear {
  return { year: date.getFullYear(), month: date.getMonth() };
}

function sameMonthYear(a: MonthYear, b: MonthYear): boolean {
  return a.year === b.year && a.month === b.month;
}

/** Check if a Date falls in the given month/year */
export function isInMonth(d: Date, my: MonthYear): boolean {
  return sameMonthYear(toMonthYear(d), my);
}

/** Get list of months that have data, from ERP store + shift store (passed as plain data to avoid store dependency in lib) */
export function getAvailableMonths(params: {
  purchaseTimestamps: Date[];
  orderCreatedAts: Date[];
  saleTimestamps: Date[];
  payrollPaidAts: Date[];
  materialCreatedAts: Date[];
  materialUpdatedAts: Date[];
  shiftStartTimes: string[]; // ISO strings
}): MonthYear[] {
  const set = new Set<string>();

  const add = (date: Date) => {
    const my = toMonthYear(date);
    set.add(`${my.year}-${my.month}`);
  };

  params.purchaseTimestamps.forEach(add);
  params.orderCreatedAts.forEach(add);
  params.saleTimestamps.forEach(add);
  params.payrollPaidAts.forEach(add);
  params.materialCreatedAts.forEach(add);
  params.materialUpdatedAts.forEach(add);
  params.shiftStartTimes.forEach((iso) => add(new Date(iso)));

  const list: MonthYear[] = Array.from(set).map((key) => {
    const [y, m] = key.split("-").map(Number);
    return { year: y, month: m };
  });

  list.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
  return list;
}

/** Format for display e.g. "February 2026" */
export function formatMonthYear(my: MonthYear): string {
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${names[my.month]} ${my.year}`;
}
