<template>
  <div class="container mt-4">
    <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">حاسبة رصيد الإجازات</a>
        <div class="d-flex gap-2">
          <select v-model="calendarMode" class="form-select form-select-sm">
            <option value="ummalqura">Umm al‑Qura</option>
            <option value="islamic">Hijri (arithmetical)</option>
          </select>
          <button class="btn btn-outline-primary btn-sm" :class="{active: view === 'leave'}" @click="view='leave'">حاسبة
          </button>
          <button class="btn btn-outline-primary btn-sm" :class="{active: view === 'days'}" @click="view='days'">عدد الأيام
          </button>
        </div>
      </div>
    </nav>

    <LeaveCalculator v-if="view === 'leave'" :calendarMode="calendarMode" />
    <DaysCounter v-else :calendarMode="calendarMode" />
  </div>
</template>

<script lang="ts">
import { ref } from 'vue'
import LeaveCalculator from './components/LeaveCalculator.vue'
import DaysCounter from './components/DaysCounter.vue'

export default {
  components: { LeaveCalculator, DaysCounter },
  setup() {
    const view = ref<'leave'|'days'>('leave')
    const calendarMode = ref<'ummalqura'|'islamic'>('ummalqura')
    return { view, calendarMode }
  }
}
</script>
