<template>
  <div>
    <div class="card">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-6">
            <label class="form-label">تاريخ التقاعد (Hijri)</label>
            <HijriDatePicker v-model="retirementModel" :calendarMode="calendarMode" @update:gregorian="onRetirementGregorianUpdate" />
          </div>
          <div class="col-md-6">
            <label class="form-label">الرصيد السابق</label>
            <input type="number" v-model.number="oldRemaining" class="form-control" />
          </div>
          <div class="col-12 mt-2">
            <label class="form-label">انسخ الجدول هنا</label>
            <textarea v-model="tblInput" class="form-control" rows="8"></textarea>
          </div>
          <div class="col-12 mt-2">
            <button class="btn btn-primary" @click="onCalc">احسب</button>
            <div class="text-danger mt-2">{{error}}</div>
          </div>

          <div class="col-12 mt-3">
            <table class="table table-striped text-center">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المدة</th>
                  <th>الرصيد الحالي</th>
                  <th>من الرصيد الحالي</th>
                  <th>باقي الرصيد الحالي</th>
                  <th>من الرصيد السابق</th>
                  <th>باقي الرصيد السابق</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in results" :key="i" :class="{'table-success': i === results.length-1}">
                  <td>{{ r.startHijri }}</td>
                  <td>{{ i === results.length-1 ? 'تقاعد' : r.vacation }}</td>
                  <td>{{ r.available }}</td>
                  <td>{{ r.fromRemaining }}</td>
                  <td>{{ r.remaining }}</td>
                  <td>{{ r.fromOldRemaining }}</td>
                  <td>{{ r.oldRemaining }}</td>
                </tr>
                <tr>
                  <th colspan="5">التعويض</th>
                  <td colspan="2">{{ finalCompensation }}</td>
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
import { defineComponent, ref, computed } from 'vue'
import { parseHijriStringToGregorian, formatHijri, setCalendarMode, calculateAccruals, todayHijriString } from '../utils'
import type { VacationRow } from '../utils'
import HijriDatePicker from './HijriDatePicker.vue'

export default defineComponent({
  components: { HijriDatePicker },
  props: { calendarMode: { type: String, required: true } },
  setup(props) {
    const retirementModel = ref<string>('1445-07-01')
    const retirementGregorian = ref<any>(parseHijriStringToGregorian(retirementModel.value, props.calendarMode as any))
    const oldRemaining = ref<number>(0)
    const tblInput = ref('')
    const error = ref('')
    const results = ref<any[]>([])

    function onRetirementGregorianUpdate(g: any) { retirementGregorian.value = g }

    function validateRetirement() {
      try {
        const g = retirementGregorian.value
        if (!g || !g.isValid()) throw new Error('التاريخ غير صحيح')
        return g
      } catch (e: any) {
        error.value = e.message || 'التاريخ غير صحيح'
        return null
      }
    }

    function onCalc() {
      error.value = ''
      setCalendarMode(props.calendarMode as any)
      const retirement = validateRetirement()
      if (!retirement) return
      if (!oldRemaining.value && oldRemaining.value !== 0) {
        error.value = 'يجب إدخال الرصيد السابق'
        return
      }
      // if (!tblInput.value.trim()) {
      //   error.value = 'يجب إدخال الإجازات'
      //   return
      // }
      let vacations = [] as { idx: number, type: string, startDate: any, vacation: number }[];
      if (tblInput.value.trim()) {
        // parse table (tab separated rows, 3rd col start date, 5th duration)
        const rows = tblInput.value.trim().split('\n').map(r => r.split('\t').map(c => c.trim()))
        vacations = rows.map((cols, idx) => {
          return {
            idx,
            type: cols[1] || '-',
            startDate: parseHijriStringToGregorian(cols[2], props.calendarMode as any),
            vacation: Number(cols[4]) || 0,
          }
        }).sort((a, b) => a.startDate.diff(b.startDate))
      }
      // If no vacations, create a single period from baseline to retirement
      if (vacations.length === 0) {
        const baseline = parseHijriStringToGregorian('1439-07-02', props.calendarMode as any)
        vacations.push({ idx: 0, type: '-', startDate: baseline, vacation: 0 })
      }
      vacations.push({ idx: -2, type: '-', startDate: retirement, vacation: 0 })
      const calc = calculateAccruals(vacations, retirement, Number(oldRemaining.value))

      results.value = calc.map((r: VacationRow) => ({ ...r, startHijri: formatHijri(r.startDate) }))
    }

    const finalCompensation = computed(() => {
      if (results.value.length === 0) return 0
      const last = results.value[results.value.length - 1]
      const compensation = last.remaining > 72 ? 72 : last.remaining
      const finalComp = Math.round((last.oldRemaining + compensation) * 100) / 100
      return finalComp
    })

    return { retirementModel, retirementGregorian, oldRemaining, tblInput, error, onCalc, results, finalCompensation, onRetirementGregorianUpdate }
  }
})
</script>
