import type { Dayjs } from 'dayjs'

export type CalendarMode = 'ummalqura' | 'islamic'

export function setCalendarMode(mode: CalendarMode): void
export function parseHijriStringToGregorian(hijriStr: string, mode?: CalendarMode): Dayjs
export function formatHijri(gregorian: any, mode?: CalendarMode): string
export function todayHijriString(mode?: CalendarMode): string
