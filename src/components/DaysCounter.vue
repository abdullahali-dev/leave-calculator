<template>
  <div>
    <div class="card">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-6">
            <small>تاريخ البداية (Hijri)</small>
            <div class="d-flex gap-2 mt-2">
              <input v-model="startInput" class="form-control" />
              <button class="btn btn-outline-secondary" @click="setToday('start')">اليوم</button>
            </div>
          </div>
          <div class="col-md-6">
            <small>تاريخ النهاية (Hijri)</small>
            <div class="d-flex gap-2 mt-2">
              <input v-model="endInput" class="form-control" />
              <button class="btn btn-outline-secondary" @click="setToday('end')">اليوم</button>
            </div>
          </div>

          <div class="col-12 mt-3 d-flex gap-2 align-items-center">
            <button class="btn btn-primary" @click="countDays">احسب عدد الايام</button>
            <div class="form-check">
              <input v-model="includeStart" class="form-check-input" type="checkbox" />
              <label class="form-check-label">شامل تاريخ البداية</label>
            </div>
            <div class="form-check">
              <input v-model="includeEnd" class="form-check-input" type="checkbox" />
              <label class="form-check-label">شامل تاريخ النهاية</label>
            </div>
            <div class="text-danger">{{ error }}</div>
          </div>

          <div class="col-12 mt-3 fw-bold">{{ summary }}</div>

          <div class="col-12 mt-2">
            <table class="table table-striped table-sm text-center">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>من</th>
                  <th>إلى</th>
                  <th>أيام</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in rows" :key="i">
                  <td>{{ r.month }}</td>
                  <td v-html="r.from"></td>
                  <td v-html="r.to"></td>
                  <td>{{ r.days }}</td>
                </tr>
                <tr class="table-secondary">
                  <th>الإجمالي</th>
                  <td v-html="summaryFrom"></td>
                  <td v-html="summaryTo"></td>
                  <td>{{ totalDays }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { parseHijriStringToGregorian, formatHijri, setCalendarMode, todayHijriString } from '../utils/calendar'
import dayjs from 'dayjs'

export default defineComponent({ props: { calendarMode: { type: String, required: true } }, setup(props) {
  const startInput = ref(todayHijriString(props.calendarMode as any))
  const endInput = ref(todayHijriString(props.calendarMode as any))
  const includeStart = ref(true)
  const includeEnd = ref(true)
  const error = ref('')

  const rows = ref<any[]>([])
  const summary = ref('—')
  const totalDays = ref(0)
  const summaryFrom = ref('')
  const summaryTo = ref('')

  function setToday(which: 'start'|'end') {
    if (which === 'start') startInput.value = todayHijriString(props.calendarMode as any)
    else endInput.value = todayHijriString(props.calendarMode as any)
  }

  function countDays() {
    error.value = ''
    setCalendarMode(props.calendarMode as any)
    try {
      let s = parseHijriStringToGregorian(startInput.value, props.calendarMode as any)
      let e = parseHijriStringToGregorian(endInput.value, props.calendarMode as any)
      if (!s.isValid() || !e.isValid()) throw new Error('التاريخ غير صالح')
      // ensure order
      if (s.isAfter(e)) { const t = s; s = e; e = t }

      const firstMomentForSegments = includeStart.value ? s.clone() : s.clone().add(1, 'day')
      const lastMomentForSegments = includeEnd.value ? e.clone() : e.clone().subtract(1, 'day')

      let total = 0
      const newRows: any[] = []

      if (!lastMomentForSegments.isBefore(firstMomentForSegments)) {
        total = lastMomentForSegments.diff(firstMomentForSegments, 'day') + 1

        let curYear = Number(firstMomentForSegments.format('iYYYY'))
        let curMonth = Number(firstMomentForSegments.format('iMM'))
        const endMonthKey = lastMomentForSegments.format('iYYYY-iMM')

        while (true) {
          const monthStart = parseHijriStringToGregorian(`${String(curYear).padStart(4,'0')}-${String(curMonth).padStart(2,'0')}-01`, props.calendarMode as any)
          const daysInMonth = Number(monthStart.format('iDaysInMonth')) || 30
          const monthEnd = monthStart.clone().add(daysInMonth - 1, 'day')

          const segStart = firstMomentForSegments.isAfter(monthStart) ? firstMomentForSegments.clone() : monthStart.clone()
          const segEndCandidate = lastMomentForSegments.isBefore(monthEnd) ? lastMomentForSegments.clone() : monthEnd.clone()

          if (!segEndCandidate.isBefore(segStart)) {
            const segDays = segEndCandidate.diff(segStart, 'day') + 1
            newRows.push({
              month: monthStart.format('iYYYY-iMM'),
              from: `${segStart.format('iYYYY-iMM-iDD')}<br><small>${segStart.format('YYYY-MM-DD')}</small>`,
              to: `${segEndCandidate.format('iYYYY-iMM-iDD')}<br><small>${segEndCandidate.format('YYYY-MM-DD')}</small>`,
              days: segDays
            })
          }

          if (monthStart.format('iYYYY-iMM') === endMonthKey) break
          if (curMonth === 12) { curMonth = 1; curYear += 1 } else curMonth += 1
        }
      }

      rows.value = newRows
      summary.value = `العدد الإجمالي للأيام: ${total}`
      summaryFrom.value = `${firstMomentForSegments.format('iYYYY-iMM-iDD')}<br><small>${firstMomentForSegments.format('YYYY-MM-DD')}</small>`
      summaryTo.value = `${lastMomentForSegments.format('iYYYY-iMM-iDD')}<br><small>${lastMomentForSegments.format('YYYY-MM-DD')}</small>`
      totalDays.value = total

    } catch (err: any) { error.value = err.message || 'خطأ' }
  }

  return { startInput, endInput, includeStart, includeEnd, setToday, countDays, error, rows, summary, totalDays, summaryFrom, summaryTo }
} })
</script>
