export type MonthBudgetPeriod = {
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  monthKey: string;
  totalDays: number;
};

export function getLastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function getMonthBudgetPeriod(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;
  const lastDay = getLastDayOfMonth(year, month);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month - 1, lastDay, 23, 59, 59, 999);
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  return {
    start,
    end,
    startLabel: `${year}/${String(month).padStart(2, "0")}/01`,
    endLabel: `${year}/${String(month).padStart(2, "0")}/${String(lastDay).padStart(2, "0")}`,
    monthKey,
    totalDays: lastDay
  };
}
