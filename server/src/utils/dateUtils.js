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

module.exports = {
  getTodayDateString,
  getEndOfDayDate,
  getCompactDateString,
  getLastNDates,
};
