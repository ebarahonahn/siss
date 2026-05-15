import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-prenatal-charts',
  template: `
    <div class="charts-container">
      <div class="chart-card">
        <h3>Curva de Ganancia de Peso</h3>
        <canvas #weightChart></canvas>
      </div>
      <div class="chart-card">
        <h3>Curva de Altura Uterina</h3>
        <canvas #heightChart></canvas>
      </div>
    </div>
  `,
  styles: [`
    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    .chart-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    h3 {
      color: #334155;
      font-size: 1rem;
      margin-bottom: 1rem;
      text-align: center;
      font-weight: 700;
    }
    canvas {
      width: 100%;
      height: 100%;
      min-height: 300px;
    }
  `],
  standalone: false
})
export class PrenatalChartsComponent implements OnInit, OnChanges {
  @Input() controles: any[] = [];
  @Input() imcInicial: number = 0;
  @Input() pesoInicialEmbarazo: number = 0;

  @ViewChild('weightChart') weightChartRef!: ElementRef;
  @ViewChild('heightChart') heightChartRef!: ElementRef;

  private weightChart: any;
  private heightChart: any;
  private baseWeight: number = 0;

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['controles'] && this.weightChartRef) {
      this.updateCharts();
    }
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  initCharts() {
    if (this.weightChart) this.weightChart.destroy();
    if (this.heightChart) this.heightChart.destroy();
    this.initWeightChart();
    this.initHeightChart();
    this.updateCharts();
  }

  initWeightChart() {
    const ctx = this.weightChartRef.nativeElement.getContext('2d');
    this.weightChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Percentil 90',
            data: this.getPercentilPeso(90),
            borderColor: 'rgba(239, 68, 68, 0.2)',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'Percentil 10',
            data: this.getPercentilPeso(10),
            borderColor: 'rgba(239, 68, 68, 0.2)',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            tension: 0.4
          },
          {
            label: 'Ganancia Paciente',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHitRadius: 30, // Radio de 30px para que sea fácil tocarlo
            showLine: true
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
        plugins: { 
          legend: { position: 'bottom' },
          tooltip: {
            enabled: true,
            displayColors: false,
            filter: (tooltipItem: any) => {
              return tooltipItem.datasetIndex === 2; // Solo el dataset del paciente
            },
            callbacks: {
              label: (context: any) => {
                const pt = context.raw;
                if (!pt || pt.x === undefined) return '';
                const base = this.baseWeight;
                const pesoReal = (parseFloat(pt.y) + parseFloat(base.toString())).toFixed(1);
                return `Semana ${pt.x.toFixed(1)}: ${pesoReal} kg (Ganancia: +${pt.y.toFixed(1)}kg)`;
              }
            }
          }
        },
        scales: {
          y: { 
            title: { display: true, text: 'Ganancia (Kg)' },
            min: 0,
            max: 20,
            ticks: { stepSize: 2 }
          },
          x: { 
            type: 'linear',
            title: { display: true, text: 'Semanas' },
            min: 5,
            max: 40,
            ticks: { stepSize: 5 }
          }
        }
      }
    });
  }

  initHeightChart() {
    const ctx = this.heightChartRef.nativeElement.getContext('2d');
    this.heightChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'P90',
            data: this.getPercentilAltura(90),
            borderColor: 'rgba(239, 68, 68, 0.2)',
            fill: false,
            pointRadius: 0,
            tension: 0.4
          },
          {
            label: 'P10',
            data: this.getPercentilAltura(10),
            borderColor: 'rgba(239, 68, 68, 0.2)',
            fill: false,
            pointRadius: 0,
            tension: 0.4
          },
          {
            label: 'Paciente',
            data: [],
            borderColor: '#10b981',
            backgroundColor: '#10b981',
            borderWidth: 2,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHitRadius: 30
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
        plugins: { 
          legend: { position: 'bottom' },
          tooltip: {
            enabled: true,
            filter: (tooltipItem: any) => {
              return tooltipItem.datasetIndex === 2; // Solo el dataset del paciente
            },
            callbacks: {
              label: (context: any) => {
                const pt = context.raw;
                if (!pt || pt.x === undefined) return '';
                return `Sem ${pt.x.toFixed(1)}: ${pt.y.toFixed(1)} cm`;
              }
            }
          }
        },
        scales: {
          y: { title: { display: true, text: 'cm' }, min: 10, max: 40 },
          x: { 
            type: 'linear',
            title: { display: true, text: 'Semanas' },
            min: 13,
            max: 40,
            ticks: { stepSize: 3 }
          }
        }
      }
    });
  }

  updateCharts() {
    if (!this.weightChart || !this.heightChart) return;

    // Actualizar datos de paciente
    const sortedControles = [...this.controles].sort((a, b) => a.semanasGestacion - b.semanasGestacion);
    
    // Peso (Ganancia)
    this.baseWeight = this.pesoInicialEmbarazo || sortedControles[0]?.peso || 0;
    const pesoData = sortedControles.map(c => ({
      x: parseFloat(c.semanasGestacion),
      y: parseFloat(c.peso) - this.baseWeight
    }));

    // Altura Uterina
    const alturaData = sortedControles.filter(c => c.alturaUterina).map(c => ({
      x: parseFloat(c.semanasGestacion),
      y: parseFloat(c.alturaUterina)
    }));

    this.weightChart.data.datasets[2].data = pesoData;
    this.heightChart.data.datasets[2].data = alturaData;

    this.weightChart.update();
    this.heightChart.update();
  }

  // Stubs de datos CLAP (Aproximados)
  private getPercentilPeso(p: number) {
    // Curva CLAP estándar para IMC Normal (Ganancia de peso esperada)
    const p90 = [
      {x: 10, y: 1.5}, {x: 13, y: 2.5}, {x: 16, y: 4.0}, {x: 20, y: 6.5},
      {x: 24, y: 9.0}, {x: 28, y: 11.5}, {x: 32, y: 14.0}, {x: 36, y: 16.5}, {x: 40, y: 19.0}
    ];
    const p10 = [
      {x: 10, y: -0.5}, {x: 13, y: 0.0}, {x: 16, y: 1.0}, {x: 20, y: 2.5},
      {x: 24, y: 4.5}, {x: 28, y: 6.5}, {x: 32, y: 8.5}, {x: 36, y: 10.0}, {x: 40, y: 11.5}
    ];
    
    const data = p === 90 ? p90 : p10;
    return data.map(pt => ({ x: pt.x, y: pt.y }));
  }

  private getPercentilAltura(p: number) {
    // Percentiles 10 y 90 de Altura Uterina (Estándar Fetal Foundation)
    const p90 = [
      {x: 13, y: 13}, {x: 16, y: 16}, {x: 20, y: 20}, {x: 24, y: 24},
      {x: 28, y: 28}, {x: 32, y: 31}, {x: 36, y: 33}, {x: 40, y: 35}
    ];
    const p10 = [
      {x: 13, y: 9}, {x: 16, y: 11}, {x: 20, y: 15}, {x: 24, y: 19},
      {x: 28, y: 22}, {x: 32, y: 25}, {x: 36, y: 28}, {x: 40, y: 30}
    ];
    const data = p === 90 ? p90 : p10;
    return data.map(pt => ({ x: pt.x, y: pt.y }));
  }
}
