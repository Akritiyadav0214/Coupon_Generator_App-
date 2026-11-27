/**
 * Returns local calendar date in YYYY-MM-DD format so daily coupon boundaries
 * align with the mess server's local day rather than UTC midnight.
 */
function getTodayDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns end-of-day Date for a YYYY-MM-DD string in local timezone.
 */
function getEndOfDayDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

/**
 * Formats YYYYMMDD from YYYY-MM-DD for coupon ID generation.
 */
function getCompactDateString(dateStr = getTodayDateString()) {
  return dateStr.replace(/-/g, '');
}

/**
 * Returns array of last N date strings (YYYY-MM-DD) in chronological order ending today.
 */
function getLastNDates(days = 7) {
  const result = [];
  const base = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    result.push(getTodayDateString(d));
  }
  return result;
}

/**
 * Returns array of N date strings (YYYY-MM-DD) starting from today through today + (days - 1).
 */
function getNextNDates(days = 8) {
  const result = [];
  const base = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    result.push(getTodayDateString(d));
  }
  return result;
}

const WEEKDAY_NAMES_UTC = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Resolves the exact weekday name (Monday..Sunday) for a YYYY-MM-DD string
 * using UTC calendar arithmetic so server timezone never shifts the day.
 */
function getWeekdayFromDateString(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return WEEKDAY_NAMES_UTC[utcDate.getUTCDay()];
}

module.exports = {
  getTodayDateString,
  getEndOfDayDate,
  getCompactDateString,
  getLastNDates,
  getNextNDates,
  getWeekdayFromDateString,
};
