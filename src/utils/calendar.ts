import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import * as umm from '@umalqura/core'

dayjs.extend(utc)

export type CalendarMode = 'ummalqura' | 'islamic'
let currentMode: CalendarMode = 'ummalqura'

function umm_toGregorian(hy:number, hm:number, hd:number) {
  const anyUmm = umm as any
  // Try multiple export shapes: direct method, .$ static, and default export
  try {
    if (anyUmm && typeof anyUmm.hijriToGregorian === 'function') {
      return anyUmm.hijriToGregorian(hy, hm, hd)
    }
    if (anyUmm && anyUmm.$ && typeof anyUmm.$.hijriToGregorian === 'function') {
      return anyUmm.$.hijriToGregorian(hy, hm, hd)
    }
    if (anyUmm && anyUmm.default && typeof anyUmm.default.hijriToGregorian === 'function') {
      return anyUmm.default.hijriToGregorian(hy, hm, hd)
    }
    if (anyUmm && anyUmm.default && anyUmm.default.$ && typeof anyUmm.default.$.hijriToGregorian === 'function') {
      return anyUmm.default.$.hijriToGregorian(hy, hm, hd)
    }
  } catch (e) {
    // fall through to fallback
    console.warn('umalqura adapter threw:', e)
  }

  // Fallback to simple arithmetical Hijri -> Gregorian conversion (less accurate than Umm al-Qura)
  console.warn('Umm al-Qura conversion function not found; falling back to arithmetic Hijri conversion')
  const jd = hijriToJulianDay(hy, hm, hd)
  const g = julianDayToGregorian(jd)
  return { gy: g.gy, gm: g.gm, gd: g.gd }
}

function umm_toIslamic(gy:number, gm:number, gd:number) {
  const anyUmm = umm as any
  try {
    if (anyUmm && typeof anyUmm.gregorianToHijri === 'function') return anyUmm.gregorianToHijri(new Date(gy, gm - 1, gd))
    if (anyUmm && anyUmm.$ && typeof anyUmm.$.gregorianToHijri === 'function') return anyUmm.$.gregorianToHijri(new Date(gy, gm - 1, gd))
    if (anyUmm && anyUmm.default && typeof anyUmm.default.gregorianToHijri === 'function') return anyUmm.default.gregorianToHijri(new Date(gy, gm - 1, gd))
    if (anyUmm && anyUmm.default && anyUmm.default.$ && typeof anyUmm.default.$.gregorianToHijri === 'function') return anyUmm.default.$.gregorianToHijri(new Date(gy, gm - 1, gd))
  } catch (e) {
    console.warn('umalqura adapter threw:', e)
  }

  // Fallback to arithmetic conversion via Julian Day
  console.warn('Umm al-Qura reverse conversion not found; falling back to arithmetic Hijri conversion')
  const jd = gregorianToJulianDay(gy, gm, gd)
  return julianDayToHijri(jd)
}

export function setCalendarMode(mode: CalendarMode) {
  currentMode = mode
}

// returns dayjs (gregorian) for a hijri string like '1443-03-20'
export function parseHijriStringToGregorian(hijriStr: string, mode: CalendarMode = currentMode) {
  // Accept many human-entered formats. Extract first three number groups (supports Arabic-Indic digits).
  const original = String(hijriStr ?? '')
  let s = original.trim()
  // remove Arabic Hijri marker and non-date letters (keep digits and separators)
  s = s.replace(/هـ|ه/g, ' ')
  // normalize Arabic comma and other punctuation to space
  s = s.replace(/[\u060C,()]/g, ' ')

  // try to match three groups of digits (Arabic-Indic or ASCII)
  const threeNums = s.match(/([0-9٠١٢٣٤٥٦٧٨٩]{3,4})[^0-9٠١٢٣٤٥٦٧٨٩]+([0-9٠١٢٣٤٥٦٧٨٩]{1,2})[^0-9٠١٢٣٤٥٦٧٨٩]+([0-9٠١٢٣٤٥٦٧٨٩]{1,2})/)
  if (!threeNums) {
    console.debug('parseHijriStringToGregorian: could not find 3-number pattern in', { original, normalized: s })
    throw new Error('تنسيق التاريخ غير مدعوم')
  }

  function toAsciiDigits(str: string) {
    const arabicNums = '٠١٢٣٤٥٦٧٨٩'
    return str.replace(/[٠-٩]/g, (d) => String(arabicNums.indexOf(d)))
  }

  const hy = Number(toAsciiDigits(threeNums[1]))
  const hm = Number(toAsciiDigits(threeNums[2]))
  const hd = Number(toAsciiDigits(threeNums[3]))

  if (isNaN(hy) || isNaN(hm) || isNaN(hd)) {
    console.debug('parseHijriStringToGregorian: numeric parse failed', { hy, hm, hd, original })
    throw new Error('تنسيق التاريخ غير مدعوم')
  }

  if (mode === 'ummalqura') {
    const g = umm_toGregorian(hy, hm, hd) // returns {gy, gm, gd}
    if (g && typeof g.gy === 'number') {
      // note: umalqura returns zero-based month (0=Jan), so add 1 when building ISO date
      return dayjs.utc(`${g.gy}-${String((g.gm ?? 0) + 1).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`)
    }
    // fallback to arithmetic
    console.warn('Umm al-Qura conversion failed; falling back to arithmetic', { hy, hm, hd })
  }

  // simple arithmetical conversion (tabular)
  const jd = hijriToJulianDay(hy, hm, hd)
  const g = julianDayToGregorian(jd)
  return dayjs.utc(`${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`)
}

export function formatHijri(gregorian: any, mode: CalendarMode = currentMode) {
  // accept dayjs or Date
  const d = dayjs.isDayjs(gregorian) ? gregorian : dayjs(gregorian)
  // default to umm alqura if available
  if (mode === 'ummalqura') {
    const y = Number(d.format('YYYY'))
    const m = Number(d.format('MM'))
    const day = Number(d.format('DD'))
    // find islamic date via reverse conversion using umalqura/core
    const h = umm_toIslamic(y, m, day)
    if (!h) return ''
    return `${h.hy}-${String(h.hm).padStart(2,'0')}-${String(h.hd).padStart(2,'0')}`
  }
  // for arithmetic, convert via JD
  const jd = gregorianToJulianDay(Number(d.format('YYYY')), Number(d.format('MM')), Number(d.format('DD')))
  const h = julianDayToHijri(jd)
  return `${h.hy}-${String(h.hm).padStart(2,'0')}-${String(h.hd).padStart(2,'0')}`
}

export function todayHijriString(mode: CalendarMode = currentMode) {
  const now = dayjs()
  return formatHijri(now, mode)
}

export function getHijriParts(d: dayjs.Dayjs, mode: CalendarMode = currentMode) {
  // Extract Hijri year, month, day from a Gregorian dayjs object
  const jd = gregorianToJulianDay(Number(d.format('YYYY')), Number(d.format('MM')), Number(d.format('DD')))
  return julianDayToHijri(jd)
}

export function hijriPartsToGregorian(hy:number, hm:number, hd:number, mode: CalendarMode = currentMode) {
  // returns dayjs for the given Hijri parts
  if (mode === 'ummalqura') {
    const g = umm_toGregorian(hy, hm, hd)
    if (g && typeof g.gy === 'number') {
      // umalqura returns zero-based month
      return dayjs.utc(`${g.gy}-${String((g.gm ?? 0) + 1).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`)
    }
  }
  const jd = hijriToJulianDay(hy, hm, hd)
  const g = julianDayToGregorian(jd)
  return dayjs.utc(`${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`)
}

export function daysInHijriMonth(hy:number, hm:number, mode: CalendarMode = currentMode) {
  if (mode === 'ummalqura') {
    const anyUmm = umm as any
    try {
      if (typeof anyUmm.getDaysInMonth === 'function') return anyUmm.getDaysInMonth(hy, hm)
      if (anyUmm && anyUmm.$ && typeof anyUmm.$.getDaysInMonth === 'function') return anyUmm.$.getDaysInMonth(hy, hm)
      if (anyUmm && anyUmm.default && typeof anyUmm.default.$ === 'object' && typeof anyUmm.default.$.getDaysInMonth === 'function') return anyUmm.default.$.getDaysInMonth(hy, hm)
    } catch (e) {
      console.warn('umalqura getDaysInMonth failed', e)
    }
  }
  // fallback: compute first day of next month minus first day of this month
  const start = hijriPartsToGregorian(hy, hm, 1, mode)
  const nextMonth = hm === 12 ? { hy: hy + 1, hm: 1 } : { hy, hm: hm + 1 }
  const next = hijriPartsToGregorian(nextMonth.hy, nextMonth.hm, 1, mode)
  return Math.round(next.diff(start, 'day'))
}

// ---- helper functions: JD conversions (arithmetical Hijri)

function hijriToJulianDay(y:number, m:number, d:number) {
  // Algorithm from: https://aan-archive.com/convert-hijri-julian
  const epoch = 1948439.5 // Islamic epoch
  const days = d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + (11 * y)) / 30)
  return days + epoch - 1
}

function julianDayToGregorian(jd:number) {
  // Fliegel & Van Flandern algorithm
  const z = Math.floor(jd + 0.5)
  const a = Math.floor((z - 1867216.25) / 36524.25)
  const A = z + 1 + a - Math.floor(a / 4)
  const B = A + 1524
  const C = Math.floor((B - 122.1) / 365.25)
  const D = Math.floor(365.25 * C)
  const E = Math.floor((B - D) / 30.6001)
  const day = B - D - Math.floor(30.6001 * E)
  let month = E < 14 ? E - 1 : E - 13
  let year = month > 2 ? C - 4716 : C - 4715
  return { gy: year, gm: month, gd: day }
}

function gregorianToJulianDay(y:number, m:number, d:number) {
  const a = Math.floor((14 - m) / 12)
  const y2 = y + 4800 - a
  const m2 = m + 12 * a - 3
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045
}

function julianDayToHijri(jd:number) {
  const jdRounded = Math.floor(jd) + 0.5
  const days = Math.floor(jdRounded - 1948439.5) + 1
  const hy = Math.floor((30 * days + 10646) / 10631)
  const mm = Math.min(12, Math.ceil((days - 29 - hijriToAbsolute(hy,1,1)) / 29.5) + 1)
  const hd = days - hijriToAbsolute(hy, mm, 1) + 1
  return { hy, hm: mm, hd }
}

function hijriToAbsolute(y:number, m:number, d:number) {
  return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30)
}
