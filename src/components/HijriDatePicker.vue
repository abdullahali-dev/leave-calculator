<template>
  <div class="d-flex gap-2 align-items-end">
    <select v-model.number="hy" @change="onChange" class="form-select form-select-sm">
      <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
    </select>
    <select v-model.number="hm" @change="onChange" class="form-select form-select-sm" style="width:100px">
      <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
    </select>
    <select v-model.number="hd" @change="onChange" class="form-select form-select-sm" style="width:100px">
      <option v-for="d in daysInCurrentMonth" :key="d" :value="d">{{ d }}</option>
    </select>
    <button class="btn btn-outline-secondary" @click="setToday">اليوم</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue'
import { formatHijri, parseHijriStringToGregorian, todayHijriString, hijriPartsToGregorian, daysInHijriMonth } from '../utils/calendar'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'HijriDatePicker',
  props: {
    modelValue: { type: String, required: false },
    calendarMode: { type: String, required: true }
  },
  emits: ['update:modelValue', 'update:gregorian'],
  setup(props, { emit }) {
    const currentIYear = Number(formatHijri(dayjs(), props.calendarMode as any).split('-')[0])
    const years = ref<number[]>([])
    const months = ref<number[]>(Array.from({ length: 12 }, (_, i) => i + 1))

    function populateYears() {
      const start = 1400
      const end = currentIYear + 2
      years.value = []
      for (let y = start; y <= end; y++) years.value.push(y)
    }
    populateYears()

    const hy = ref<number>(currentIYear)
    const hm = ref<number>(1)
    const hd = ref<number>(1)

    const daysInCurrentMonth = computed(() => daysInHijriMonth(hy.value, hm.value, props.calendarMode as any))

    // initialize from modelValue or today
    function initFromModelOrToday() {
      if (props.modelValue) {
        try {
          const parts = String(props.modelValue).split('-').map(p => Number(p))
          if (parts.length === 3 && parts.every(n => !isNaN(n))) {
            hy.value = parts[0]; hm.value = parts[1]; hd.value = Math.min(parts[2], daysInHijriMonth(parts[0], parts[1], props.calendarMode as any))
            emitGregorian()
            return
          }
        } catch (e) { /* fallback to today */ }
      }
      const today = todayHijriString(props.calendarMode as any).split('-').map(p => Number(p))
      hy.value = today[0]; hm.value = today[1]; hd.value = today[2]
      emitModelAndGregorian()
    }

    function emitModelAndGregorian() {
      const str = `${String(hy.value).padStart(4, '0')}-${String(hm.value).padStart(2,'0')}-${String(hd.value).padStart(2,'0')}`
      emit('update:modelValue', str)
      emitGregorian()
    }

    function emitGregorian() {
      try {
        const g = hijriPartsToGregorian(hy.value, hm.value, hd.value, props.calendarMode as any)
        emit('update:gregorian', g)
      } catch (e) {
        // ignore
      }
    }

    function onChange() {
      // ensure hd is valid for selected month
      hd.value = Math.min(hd.value, daysInHijriMonth(hy.value, hm.value, props.calendarMode as any))
      emitModelAndGregorian()
    }

    function setToday() {
      const s = todayHijriString(props.calendarMode as any).split('-').map(p => Number(p))
      hy.value = s[0]; hm.value = s[1]; hd.value = s[2]
      emitModelAndGregorian()
    }

    watch(() => props.modelValue, () => initFromModelOrToday(), { immediate: true })

    return { years, months, hy, hm, hd, daysInCurrentMonth, onChange, setToday }
  }
})
</script>
