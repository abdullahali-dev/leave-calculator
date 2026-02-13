<template>
  <div>
    <div class="card">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-6">
            <small>تاريخ البداية (Hijri)</small>
            <HijriDatePicker v-model="startModel" :calendarMode="calendarMode" @update:gregorian="onStartGregorianUpdate" />
          </div>

          <div class="col-md-6">
            <small>تاريخ النهاية (Hijri)</small>
            <HijriDatePicker v-model="endModel" :calendarMode="calendarMode" @update:gregorian="onEndGregorianUpdate" />
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
import { parseHijriStringToGregorian, formatHijri, setCalendarMode, todayHijriString, hijriPartsToGregorian, daysInHijriMonth } from '../utils/calendar'
import dayjs from 'dayjs'
import HijriDatePicker from './HijriDatePicker.vue'

export default defineComponent({
  components: { HijriDatePicker },
  props: { calendarMode: { type: String, required: true } },
  setup(props) {
  // Dropdown-based hijri pickers
  const currentIYear = Number(formatHijri(dayjs(), props.calendarMode as any).split('-')[0])
  const years = ref<number[]>([])
  const months = ref<number[]>(Array.from({ length: 12 }, (_, i) => i + 1))

  const startModel = ref<string>(todayHijriString(props.calendarMode as any))
  const endModel = ref<string>(todayHijriString(props.calendarMode as any))
  const startGregorian = ref<any>(parseHijriStringToGregorian(startModel.value, props.calendarMode as any))
  const endGregorian = ref<any>(parseHijriStringToGregorian(endModel.value, props.calendarMode as any))

  const includeStart = ref(true)
  const includeEnd = ref(true)
  const error = ref('')

  const rows = ref<any[]>([])
  const summary = ref('—')
  const totalDays = ref(0)
  const summaryFrom = ref('')
  const summaryTo = ref('')

  function populateYears() {
    const start = 1400
    const end = currentIYear + 2
    years.value = []
    for (let y = start; y <= end; y++) years.value.push(y)
  }



  function setToday(which: 'start'|'end') {
    const s = todayHijriString(props.calendarMode as any)
    if (which === 'start') {
      startModel.value = s
      startGregorian.value = parseHijriStringToGregorian(s, props.calendarMode as any)
    } else {
      endModel.value = s
      endGregorian.value = parseHijriStringToGregorian(s, props.calendarMode as any)
    }
  }

  populateYears()
  setToday('start')
  setToday('end')

  function onStartGregorianUpdate(g: any) { startGregorian.value = g }
  function onEndGregorianUpdate(g: any) { endGregorian.value = g }

  function countDays() {
    error.value = ''
    setCalendarMode(props.calendarMode as any)
    try {
      const s = startGregorian.value
      const e = endGregorian.value
      if (!s || !e || !s.isValid() || !e.isValid()) throw new Error('التاريخ غير صالح')
      // ensure s <= e
      let s2 = s.clone(), e2 = e.clone()
      if (s2.isAfter(e2)) { const tmp = s2; s2 = e2; e2 = tmp }

      const firstMomentForSegments = includeStart.value ? s2.clone() : s2.clone().add(1, 'day')
      const lastMomentForSegments = includeEnd.value ? e2.clone() : e2.clone().subtract(1, 'day')

      let total = 0
      const newRows: any[] = []

      if (!lastMomentForSegments.isBefore(firstMomentForSegments)) {
        total = lastMomentForSegments.diff(firstMomentForSegments, 'day') + 1

        const firstHijri = formatHijri(firstMomentForSegments, props.calendarMode as any)
        let [curYear, curMonth] = firstHijri.split('-').map(p => Number(p))
        const endMonthKey = formatHijri(lastMomentForSegments, props.calendarMode as any).split('-').slice(0,2).join('-')

        let iterations = 0
        while (true) {
          iterations++
          if (iterations > 500) { console.warn('days counter loop exceeded max iterations'); break }
          const monthStart = hijriPartsToGregorian(curYear, curMonth, 1, props.calendarMode as any)
          const daysInMonth = daysInHijriMonth(curYear, curMonth, props.calendarMode as any)
          const monthEnd = monthStart.clone().add(daysInMonth - 1, 'day')

          const segStart = firstMomentForSegments.isAfter(monthStart) ? firstMomentForSegments.clone() : monthStart.clone()
          const segEndCandidate = lastMomentForSegments.isBefore(monthEnd) ? lastMomentForSegments.clone() : monthEnd.clone()

          if (!segEndCandidate.isBefore(segStart)) {
            const segDays = segEndCandidate.diff(segStart, 'day') + 1
            newRows.push({
              month: formatHijri(monthStart, props.calendarMode as any).split('-').slice(0,2).join('-'),
              from: `${formatHijri(segStart, props.calendarMode as any)}<br><small>${segStart.format('YYYY-MM-DD')}</small>`,
              to: `${formatHijri(segEndCandidate, props.calendarMode as any)}<br><small>${segEndCandidate.format('YYYY-MM-DD')}</small>`,
              days: segDays
            })
          }

          if (formatHijri(monthStart, props.calendarMode as any).split('-').slice(0,2).join('-') === endMonthKey) break
          if (curMonth === 12) { curMonth = 1; curYear += 1 } else curMonth += 1
        }
      }

      rows.value = newRows
      summary.value = `العدد الإجمالي للأيام: ${total}`
      summaryFrom.value = `${formatHijri(firstMomentForSegments, props.calendarMode as any)}<br><small>${firstMomentForSegments.format('YYYY-MM-DD')}</small>`
      summaryTo.value = `${formatHijri(lastMomentForSegments, props.calendarMode as any)}<br><small>${lastMomentForSegments.format('YYYY-MM-DD')}</small>`
      totalDays.value = total

    } catch (err: any) { error.value = err.message || 'خطأ' }
  }
  return { years, months, startModel, endModel, startGregorian, endGregorian, includeStart, includeEnd, setToday, countDays, error, rows, summary, totalDays, summaryFrom, summaryTo, daysInHijriMonth, onStartGregorianUpdate, onEndGregorianUpdate }

} })
</script>
