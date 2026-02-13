import { describe, it, expect } from 'vitest'
import { parseHijriStringToGregorian, setCalendarMode } from '../src/utils'

describe('parseHijriStringToGregorian - more formats', () => {
  const samples = [
    '1445/1/3',
    '1445 1 3',
    'on 1445-01-03',
    '١٤٤٥ ٠١ ٠٣',
    '1445-01-03 هـ',
    '1445.01.03',
    '  1445/01/03  '
  ]

  samples.forEach(s => it(`parses ${s}`, () => {
    setCalendarMode('ummalqura')
    const d = parseHijriStringToGregorian(s)
    expect(d).toBeTruthy()
  }))
})
