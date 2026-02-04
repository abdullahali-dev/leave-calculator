import { describe, it, expect } from 'vitest'
import { parseHijriStringToGregorian, formatHijri, setCalendarMode } from '../src/utils/calendar'

describe('calendar conversions', () => {
  it('parses and formats using umm alqura', () => {
    setCalendarMode('ummalqura')
    const g = parseHijriStringToGregorian('1445-01-01', 'ummalqura')
    expect(g).toBeTruthy()
    const h = formatHijri(g, 'ummalqura')
    expect(h.startsWith('1445')).toBe(true)
  })

  it('parses arithmetical islamic', () => {
    setCalendarMode('islamic')
    const g = parseHijriStringToGregorian('1445-01-01', 'islamic')
    expect(g).toBeTruthy()
    const h = formatHijri(g, 'islamic')
    expect(h.startsWith('1445')).toBe(true)
  })
})
