// Quick test for accrual calculation
import dayjs from 'dayjs';
import { parseHijriStringToGregorian } from './src/utils/calendar.ts';
import { calculateAccruals } from './src/utils/accrual.ts';

// Test case: baseline 1439-07-02 to retirement 1447-07-02
const baseline = parseHijriStringToGregorian('1439-07-02', 'ummalqura');
const retirement = parseHijriStringToGregorian('1447-07-02', 'ummalqura');

console.log('Baseline:', baseline.format('YYYY-MM-DD'));
console.log('Retirement:', retirement.format('YYYY-MM-DD'));

const daysDiff = retirement.diff(baseline, 'day');
console.log('Days difference (Gregorian):', daysDiff);

const adjusted = Math.floor(daysDiff * (360 / 365));
console.log('Days adjusted for 360-day year:', adjusted);
console.log('Accrual (days * 0.1):', adjusted * 0.1);

// Calculate with no vacations
const vacations = [
  { idx: 0, type: '-', startDate: baseline, vacation: 0 },
  { idx: -2, type: '-', startDate: retirement, vacation: 0 }
];

const result = calculateAccruals(vacations, retirement, 0);
console.log('\nCalculation results:');
result.forEach((r, i) => {
  console.log(`Row ${i}: available=${r.available}, remaining=${r.remaining}`);
});
