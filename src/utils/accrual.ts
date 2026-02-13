import dayjs from 'dayjs'
import { parseHijriStringToGregorian, formatHijri, getHijriParts } from './calendar'

export interface VacationRow {
  idx: number
  type: string
  startDate: dayjs.Dayjs
  vacation: number
  available?: number
  remaining?: number
  fromRemaining?: number
  fromOldRemaining?: number
  oldRemaining?: number
}

function calculateHijriDays(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): number {
  // Calculate days based on Hijri calendar with 360-day year
  const startH = getHijriParts(startDate)
  const endH = getHijriParts(endDate)
  
  // Convert Hijri dates to absolute days
  // Each Hijri year is 354 or 355 days (average 354.36667)
  // But we want to use 360 days per year for accrual calculation
  const hijriToAbsolute = (y: number, m: number, d: number) => {
    return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30)
  }
  
  const startAbsolute = hijriToAbsolute(startH.hy, startH.hm, startH.hd)
  const endAbsolute = hijriToAbsolute(endH.hy, endH.hm, endH.hd)
  
  // The actual difference, then convert to 360-day year basis
  const actualDays = endAbsolute - startAbsolute
  return Math.floor(actualDays * (360 / 354.36667)) // 354.36667 is average Hijri year
}

export function calculateAccruals(vacations: VacationRow[], retirement: dayjs.Dayjs, oldRemainingStart: number) {
  // keep same business rules from original app
  // baseline start date for accruals (convert Hijri baseline to Gregorian)
  const baseline = parseHijriStringToGregorian('1439-07-02', 'ummalqura')

  // ensure all dates are dayjs
  const v: VacationRow[] = vacations.map(x => ({ ...x }))

  // carry for accrual decimals
  let accrualCarry = 0;
  // compute accruals: for each row, compute days between previous start and current start (first from baseline)
  for (let i = 0; i < v.length; i++) {
    const row = v[i]!
    if (!row) continue
    const start = i === 0 ? baseline : v[i - 1]!.startDate
    const end = row.startDate

    const days = calculateHijriDays(start, end)
    // console.log(`${formatHijri(start, 'ummalqura')} => ${formatHijri(end, 'ummalqura')} = ${days} days * 0.1 = ${days * 0.1}`);
    const accrual = days * 0.1;
    let accrualInteger = 0;
    if (i + 1 == v.length) {
      accrualInteger = accrual;
    } else {
      accrualInteger = Math.floor(accrual);
    }
    const accrualDecimal = accrual - accrualInteger;
    accrualCarry = roundToTwo(accrualCarry + accrualDecimal);
    let carryInteger = 0;
    if (i + 1 == v.length) {
      carryInteger = accrualCarry;
    } else {
      carryInteger = Math.floor(accrualCarry);
    }
    const addToAvailable = accrualInteger + carryInteger;
    accrualCarry = roundToTwo(accrualCarry - carryInteger);
    row.available = roundToTwo((row.available ?? 0) + addToAvailable);

    row.remaining = roundToTwo((row.available ?? 0) - (row.vacation ?? 0))

    const rem = row.remaining ?? 0
    if (rem > 0) {
      if (i < v.length - 1) {
        v[i + 1]!.available = rem
      }
      const vacAmount = Number(row.vacation ?? 0)
      row.fromRemaining = vacAmount
      row.fromOldRemaining = 0
    } else {
      row.fromRemaining = row.available
      row.fromOldRemaining = Math.abs(rem)
      row.remaining = 0
    }
    oldRemainingStart -= Number(row.fromOldRemaining ?? 0)
    row.oldRemaining = roundToTwo(Number(oldRemainingStart) || 0)
  }

  return v
}

function roundToTwo(num:number) {
  return Math.round(num * 100) / 100
}
