const JST_TIME_ZONE = "Asia/Tokyo";

export type MonthBudgetPeriod = {
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
  startLabel: string;
  endLabel: string;
  monthKey: string;
  monthLabel: string;
  totalDays: number;
  year: number;
  month: number;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function toJSTParts(referenceDate = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(referenceDate);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value)
  };
}

export function getLastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getMonthPeriodJST(referenceDate = new Date()): MonthBudgetPeriod {
  const { year, month } = toJSTParts(referenceDate);
  const totalDays = getLastDayOfMonth(year, month);
  const startDate = formatDateKey(year, month, 1);
  const endDate = formatDateKey(year, month, totalDays);
  const monthKey = `${year}-${pad2(month)}`;
  const startLabel = `${year}/${pad2(month)}/01`;
  const endLabel = `${year}/${pad2(month)}/${pad2(totalDays)}`;

  return {
    start: new Date(`${startDate}T00:00:00+09:00`),
    end: new Date(`${endDate}T23:59:59.999+09:00`),
    startDate,
    endDate,
    startLabel,
    endLabel,
    monthKey,
    monthLabel: `${year}年${month}月`,
    totalDays,
    year,
    month
  };
}

export function getCurrentMonthPeriodJST() {
  return getMonthPeriodJST(new Date());
}

export function getMonthBudgetPeriod(referenceDate = new Date()) {
  return getMonthPeriodJST(referenceDate);
}

export function getMonthStartJST(referenceDate = new Date()) {
  return getMonthPeriodJST(referenceDate).startDate;
}

export function getMonthEndJST(referenceDate = new Date()) {
  return getMonthPeriodJST(referenceDate).endDate;
}

export function getTodayJSTDateString(referenceDate = new Date()) {
  const { year, month, day } = toJSTParts(referenceDate);
  return formatDateKey(year, month, day);
}

export function getJSTDayOfMonth(referenceDate = new Date()) {
  return toJSTParts(referenceDate).day;
}

export function isDateInMonthJST(dateValue: string, referenceDate = new Date()) {
  if (!dateValue) return false;
  const dateKey = dateValue.slice(0, 10);
  const period = getMonthPeriodJST(referenceDate);
  return dateKey >= period.startDate && dateKey <= period.endDate;
}

export function getReferenceDateFromMonthKey(monthKey: string) {
  const [yearValue, monthValue] = monthKey.split("-").map(Number);
  const year = Number.isFinite(yearValue) ? yearValue : toJSTParts().year;
  const month = Number.isFinite(monthValue) ? monthValue : toJSTParts().month;
  return new Date(`${formatDateKey(year, month, 1)}T12:00:00+09:00`);
}

export function shiftMonthKey(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}`;
}
