import { describe, it, expect } from 'vitest'
import { parseHijriStringToGregorian, setCalendarMode } from '../src/utils'

describe('parseHijriStringToGregorian', () => {
  it('parses ascii hijri date', () => {
    setCalendarMode('ummalqura')
    const d = parseHijriStringToGregorian('1445-01-02')
    expect(d).toBeTruthy()
  })

  it('parses arabic-indic digits', () => {
    setCalendarMode('ummalqura')
    const d = parseHijriStringToGregorian('١٤٤٥/٠١/٠٣')
    expect(d).toBeTruthy()
  })

  it('accepts هـ suffix', () => {
    setCalendarMode('ummalqura')
    const d = parseHijriStringToGregorian('1445-01-04 هـ')
    expect(d).toBeTruthy()
  })
})
