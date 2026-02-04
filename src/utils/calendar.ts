import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { toGregorian as u_toGregorian, toIslamic as u_toIslamic } from 'ummalqura-js'

dayjs.extend(utc)

export type CalendarMode = 'ummalqura' | 'islamic'
let currentMode: CalendarMode = 'ummalqura'

export function setCalendarMode(mode: CalendarMode) {
  currentMode = mode
}

// returns dayjs (gregorian) for a hijri string like '1443-03-20'
export function parseHijriStringToGregorian(hijriStr: string, mode: CalendarMode = currentMode) {
  const s = hijriStr.trim().replace(/[\/\.\s]+/g, '-')
  const parts = s.split('-')
  if (parts.length !== 3) throw new Error('تنسيق التاريخ غير مدعوم')
  const hy = Number(parts[0]), hm = Number(parts[1]), hd = Number(parts[2])
  if (isNaN(hy) || isNaN(hm) || isNaN(hd)) throw new Error('تنسيق التاريخ غير مدعوم')

  if (mode === 'ummalqura') {
    const g = u_toGregorian(hy, hm, hd) // returns {gy, gm, gd}
    if (!g) throw new Error('تعذر تحويل التاريخ (Umm al-Qura)')
    return dayjs.utc(`${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`)
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
    // find islamic date via reverse conversion using ummalqura-js
    const h = u_toIslamic(y, m, day)
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
