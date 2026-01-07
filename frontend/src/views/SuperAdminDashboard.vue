<template>
  <div :class="['page', { light: isLight }]">
    <header>
      <h1>SUPER_ADMIN DASHBOARD</h1>
      <button class="toggle-btn" @click="toggleMode">
        {{ isLight ? '☀️' : '🌙' }}
      </button>
    </header>

    <main class="dashboard">

      <div class="card">
        <h2>NÚMERO DE DOWNLOADS</h2>
        <div class="number">{{ downloads }}</div>
        <span>Quantas vezes o aplicativo foi baixado por escolas</span>
      </div>

      <div class="card">
        <h2>USUÁRIOS ATIVOS</h2>
        <div class="number">{{ usuarios }}</div>
        <span>Quantas escolas estão usando o sistema neste momento</span>
      </div>

      <div class="card">
        <h2>DADOS DE USO</h2>
        <canvas ref="usageChart"></canvas>
        <span>Informações sobre como os usuários estão interagindo com o sistema</span>
      </div>

      <div class="card">
        <h2>RECEITA MENSAL POR SERVIÇO</h2>
        <canvas ref="serviceChart"></canvas>
        <span>Ganho mensal por serviço, conforme a taxa de 1,3%</span>
      </div>

      <div class="card">
        <h2>RECEITA TOTAL POR MÊS</h2>
        <canvas ref="monthBarChart"></canvas>
        <span>Ganho total mensal conforme a taxa de 1,3%</span>
      </div>

      <div class="card">
        <h2>RECEITA TOTAL POR MÊS</h2>
        <canvas ref="monthLineChart"></canvas>
      </div>

    </main>
  </div>
</template>

<script>
import {
  Chart,
  DoughnutController,
  BarController,
  LineController,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'

Chart.register(
  DoughnutController,
  BarController,
  LineController,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

export default {
  name: 'SuperAdminDashboard',

  data() {
    return {
      isLight: false,
      downloads: 0,
      usuarios: 0,
      charts: {}
    }
  },

  mounted() {
    this.animateNumbers()
    this.initCharts()
  },

  methods: {
    toggleMode() {
      this.isLight = !this.isLight
      this.updateChartsTheme()
    },

    animateNumbers() {
      this.countUp('downloads', 1234)
      this.countUp('usuarios', 534)
    },

    countUp(field, target) {
      let current = 0
      const step = target / 100
      const interval = setInterval(() => {
        current += step
        if (current >= target) {
          this[field] = target.toLocaleString()
          clearInterval(interval)
        } else {
          this[field] = Math.floor(current).toLocaleString()
        }
      }, 20)
    },

    chartColors() {
      return {
        text: this.isLight ? '#222' : '#fff',
        grid: this.isLight ? '#ccc' : '#444'
      }
    },

    initCharts() {
      this.initUsageChart()
      this.initServiceChart()
      this.initMonthBarChart()
      this.initMonthLineChart()
    },

    updateChartsTheme() {
      Object.values(this.charts).forEach(c => c.destroy())
      this.initCharts()
    },

    initUsageChart() {
      let current = 0
      const ctx = this.$refs.usageChart

      this.charts.usage = new Chart(ctx, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [0, 100],
            backgroundColor: ['limegreen', '#333'],
            borderWidth: 0
          }]
        },
        options: {
          rotation: -90,
          circumference: 180,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          }
        },
        plugins: [{
          id: 'text',
          beforeDraw: chart => {
            const { ctx, chartArea } = chart
            ctx.save()
            ctx.fillStyle = this.chartColors().text
            ctx.font = 'bold 22px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('65%', chartArea.width / 2, chartArea.height - 10)
            ctx.restore()
          }
        }]
      })

      const interval = setInterval(() => {
        if (current >= 65) return clearInterval(interval)
        current++
        this.charts.usage.data.datasets[0].data = [current, 100 - current]
        this.charts.usage.update()
      }, 30)
    },

    initServiceChart() {
      const c = this.chartColors()
      this.charts.service = new Chart(this.$refs.serviceChart, {
        type: 'bar',
        data: {
          labels: ['Pix', 'Cartão', 'Boleto', 'Débito'],
          datasets: [{
            data: [23, 18, 13, 9],
            backgroundColor: ['limegreen', 'dodgerblue', 'orange', 'crimson']
          }]
        },
        options: {
          animation: { duration: 1800, easing: 'easeOutElastic' },
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: c.text }, grid: { color: c.grid } },
            y: { ticks: { color: c.text }, grid: { color: c.grid }, beginAtZero: true }
          }
        }
      })
    },

    initMonthBarChart() {
      const c = this.chartColors()
      this.charts.monthBar = new Chart(this.$refs.monthBarChart, {
        type: 'bar',
        data: {
          labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Dez'],
          datasets: [{
            data: [2000,2300,2700,2800,3000,3300,3600,4000],
            backgroundColor: 'dodgerblue'
          }]
        },
        options: {
          animation: { duration: 2000, easing: 'easeOutBounce' },
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: c.text }, grid: { color: c.grid } },
            y: { ticks: { color: c.text }, grid: { color: c.grid }, beginAtZero: true }
          }
        }
      })
    },

    initMonthLineChart() {
      const c = this.chartColors()
      this.charts.monthLine = new Chart(this.$refs.monthLineChart, {
        type: 'line',
        data: {
          labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Dez'],
          datasets: [{
            data: [2100,2500,2800,2900,3100,3400,3700,4200],
            borderColor: 'dodgerblue',
            backgroundColor: 'rgba(30,144,255,0.3)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          animation: { duration: 2500, easing: 'easeOutQuart' },
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: c.text }, grid: { color: c.grid } },
            y: { ticks: { color: c.text }, grid: { color: c.grid }, beginAtZero: true }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.page {
  background: #0d124a;
  min-height: 100vh;
  color: #fff;
  transition: all 0.3s;
}

.page.light {
  background: #f4f4f4;
  color: #222;
}

header {
  padding: 20px;
  text-align: center;
  position: relative;
}

.toggle-btn {
  position: absolute;
  right: 20px;
  top: 20px;
  background: #141b5a;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.page.light .toggle-btn {
  background: #ddd;
  color: #222;
}

.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 20px;
}

.card {
  background: #141b5a;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  transition: all 0.3s;
}

.page.light .card {
  background: #fff;
}

.card h2 {
  font-size: 15px;
}

.number {
  font-size: 36px;
  font-weight: bold;
}

.card span {
  margin-top: 10px;
  display: block;
  font-size: 14px;
  color: #ddd;
}

/* 🔥 REGRA CRÍTICA: nunca deixar legenda clara no modo claro */
.page.light .card span,
.page.light .card h2,
.page.light .number {
  color: #222 !important;
}

@media (max-width: 1200px) {
  .dashboard { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .dashboard { grid-template-columns: 1fr; }
}
</style>
