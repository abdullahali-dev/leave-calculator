import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import { calculateAccruals } from '../src/utils/accrual'

describe('accrual logic', () => {
  it('calculates example accruals preserving business rules', () => {
    const vacs = [
      { idx: 0, type: 'v', startDate: dayjs('2023-01-01'), vacation: 10 },
      { idx: 1, type: 'v', startDate: dayjs('2023-07-01'), vacation: 5 }
    ]
    const res = calculateAccruals(vacs, dayjs('2024-01-01'), 20)
    expect(res.length).toBe(2)
    expect(res[0].available).toBeDefined()
  })
})
