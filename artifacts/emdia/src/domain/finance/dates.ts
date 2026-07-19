export const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const validateDate = (dateStr: string): void => {
  if (!DATE_FORMAT_REGEX.test(dateStr)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }
  const dateObj = new Date(`${dateStr}T12:00:00Z`); // Avoid timezone shifts
  if (Number.isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date value: ${dateStr}.`);
  }
};

export const parseDate = (dateStr: string): Date => {
  validateDate(dateStr);
  return new Date(`${dateStr}T12:00:00Z`);
};

export const compareDates = (dateA: string, dateB: string): number => {
  validateDate(dateA);
  validateDate(dateB);
  if (dateA < dateB) return -1;
  if (dateA > dateB) return 1;
  return 0;
};

export const differenceInDays = (startDate: string, endDate: string): number => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 3600 * 24));
};

export const addDays = (dateStr: string, days: number): string => {
  const date = parseDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const isOverdue = (dueDate: string, referenceDate: string): boolean => {
  return compareDates(dueDate, referenceDate) < 0;
};
