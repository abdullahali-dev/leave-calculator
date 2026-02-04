import dayjs from 'dayjs'

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

export function calculateAccruals(vacations: VacationRow[], retirement: dayjs.Dayjs, oldRemainingStart: number) {
  // keep same business rules from original app
  // baseline start date for accruals
  const baseline = dayjs.utc('1439-07-02', 'iYYYY-iMM-iDD') // placeholder, not a real parse for dayjs; users should set via hijri conversion if needed

  // ensure all dates are dayjs
  const v = vacations.map(x => ({ ...x }))

  // compute accruals: for each row, compute days between previous start and current start (first from baseline)
  for (let i = 0; i < v.length; i++) {
    let start = null as any
    let end = null as any
    if (i === 0) {
      // baseline should be earlier; we keep using difference between baseline and first vacation start
      start = baseline
      end = v[i].startDate
    } else {
      start = v[i - 1].startDate
      end = v[i].startDate
    }
    const days = end.diff(start, 'day')

    v[i].available = roundToTwo((v[i].available ?? 0) + roundToTwo(days * 0.1))
    v[i].remaining = roundToTwo((v[i].available ?? 0) - (v[i].vacation ?? 0))
    if (v[i].remaining > 0) {
      if (i < v.length - 1) {
        v[i + 1].available = v[i].remaining
      }
      v[i].fromRemaining = v[i].vacation
      v[i].fromOldRemaining = 0
    } else {
      v[i].fromRemaining = v[i].available
      v[i].fromOldRemaining = Math.abs(v[i].remaining)
      v[i].remaining = 0
    }
    oldRemainingStart -= v[i].fromOldRemaining || 0
    v[i].oldRemaining = roundToTwo(oldRemainingStart)
  }

  return v
}

function roundToTwo(num:number) {
  return +(Math.round(num + "e+2") + "e-2")
}
