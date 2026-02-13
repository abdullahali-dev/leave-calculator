<template>
  <div :data-bs-theme="darkMode ? 'dark' : 'light'" class="d-flex flex-column min-vh-100">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold fs-5" href="#">
          <i class="bi bi-calendar-event me-2"></i>حاسبة رصيد الإجازات
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarContent">
          <div class="navbar-nav ms-auto d-flex gap-2 align-items-center">
            <div class="nav-item">
              <select v-model="calendarMode" class="form-select form-select-sm">
                <option value="ummalqura">Umm al‑Qura</option>
                <option value="islamic">Hijri (arithmetical)</option>
              </select>
            </div>
            <div class="nav-item btn-group" role="group">
              <button type="button" class="btn btn-outline-light btn-sm" :class="{active: view === 'leave'}" @click="view='leave'">
                <i class="bi bi-calculator me-1"></i>حاسبة
              </button>
              <button type="button" class="btn btn-outline-light btn-sm" :class="{active: view === 'days'}" @click="view='days'">
                <i class="bi bi-calendar-range me-1"></i>عدد الأيام
              </button>
            </div>
            <button class="btn btn-outline-light btn-sm d-flex align-items-center gap-1" @click="darkMode = !darkMode" :title="darkMode ? 'Light Mode' : 'Dark Mode'">
              <i :class="darkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill'" style="font-size: 1rem;"></i>
              <span class="d-none d-sm-inline">{{ darkMode ? 'Light' : 'Dark' }}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mt-4 mb-4 flex-grow-1" dir="rtl">
      <LeaveCalculator v-if="view === 'leave'" :calendarMode="calendarMode" />
      <DaysCounter v-else :calendarMode="calendarMode" />
    </div>

    <footer class="bg-light border-top py-3 mt-auto" :class="darkMode ? 'bg-dark' : 'bg-light'">
      <div class="container-fluid text-center text-muted small">
        <p class="mb-0">© 2026 حاسبة رصيد الإجازات - Leave Calculator</p>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { ref, watch } from 'vue'
import LeaveCalculator from './components/LeaveCalculator.vue'
import DaysCounter from './components/DaysCounter.vue'

export default {
  components: { LeaveCalculator, DaysCounter },
  setup() {
    const view = ref<'leave'|'days'>('leave')
    const calendarMode = ref<'ummalqura'|'islamic'>('ummalqura')
    const savedDarkMode = localStorage.getItem('darkMode')
    const darkMode = ref(savedDarkMode === 'true' ? true : savedDarkMode === 'false' ? false : false)

    watch(darkMode, () => {
      localStorage.setItem('darkMode', JSON.stringify(darkMode.value))
    })

    return { view, calendarMode, darkMode }
  }
}
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.navbar-brand {
  letter-spacing: 0.5px;
}

.btn-group .btn.active {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

footer {
  transition: background-color 0.3s ease;
}
</style>
