import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-crecimiento-charts',
  standalone: false,
  templateUrl: './crecimiento-charts.component.html',
  styleUrls: ['./crecimiento-charts.component.css']
})
export class CrecimientoChartsComponent implements OnChanges, AfterViewInit {
  @Input() pacienteId!: number;
  @Input() fechaNacimiento!: string;
  @Input() controles: any[] = [];

  @ViewChild('pesoEdadChart') pesoEdadChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tallaEdadChart') tallaEdadChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('imcChart') imcChartRef!: ElementRef<HTMLCanvasElement>;

  charts: any = {};

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['controles'] && this.controles.length > 0) {
      this.updateCharts();
    }
  }

  ngAfterViewInit(): void {
    this.initCharts();
  }

  initCharts() {
    this.createChart(this.pesoEdadChartRef.nativeElement, 'pesoEdadChart', 'Peso (kg)', 'rgba(59, 130, 246, 1)');
    this.createChart(this.tallaEdadChartRef.nativeElement, 'tallaEdadChart', 'Talla (cm)', 'rgba(34, 197, 94, 1)');
    this.createChart(this.imcChartRef.nativeElement, 'imcChart', 'IMC', 'rgba(168, 85, 247, 1)');
    
    // Si ya tenemos controles al inicializar, actualizar los gráficos de inmediato
    if (this.controles && this.controles.length > 0) {
      this.updateCharts();
    }
  }

  createChart(canvasEl: HTMLCanvasElement, id: string, label: string, color: string) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    this.charts[id] = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'P95 (Superior)',
            data: [],
            borderColor: 'rgba(239, 68, 68, 0.4)',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            tension: 0.4
          },
          {
            label: 'P50 (Promedio)',
            data: [],
            borderColor: 'rgba(156, 163, 175, 0.6)',
            fill: false,
            pointRadius: 0,
            tension: 0.4
          },
          {
            label: 'P5 (Inferior)',
            data: [],
            borderColor: 'rgba(239, 68, 68, 0.4)',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            tension: 0.4
          },
          {
            label: `Paciente: ${label}`,
            data: [],
            borderColor: color,
            backgroundColor: color,
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHitRadius: 30,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            fill: false,
            tension: 0.3,
            showLine: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { 
            type: 'linear', 
            title: { display: true, text: 'Edad (Meses)' },
            min: 0,
            suggestedMax: 60
          },
          y: { title: { display: true, text: label } }
        }
      }
    });
  }

  updateCharts() {
    if (!this.charts['pesoEdadChart'] || !this.fechaNacimiento) return;

    const nac = new Date(this.fechaNacimiento);
    const controlesAsc = [...this.controles].reverse();
    
    // Datos del Paciente (Objetos {x, y} para escala lineal)
    const dataPaciente = controlesAsc.map(c => {
      const fechaC = new Date(c.creadoEn);
      const x = (fechaC.getFullYear() - nac.getFullYear()) * 12 + (fechaC.getMonth() - nac.getMonth());
      return { x, y: Number(c.peso), talla: Number(c.talla), imc: Number(c.imc) };
    });

    const maxMes = Math.max(120, ...dataPaciente.map(d => d.x + 12));

    // Actualizar dinámicamente el límite del eje X para que no se recorten los puntos
    ['pesoEdadChart', 'tallaEdadChart', 'imcChart'].forEach(id => {
      if (this.charts[id]) {
        this.charts[id].options.scales.x.max = maxMes;
      }
    });

    // Generar Curvas de Referencia (Puntos cada 6 meses para suavidad)
    const refMeses: number[] = [];
    for(let m=0; m<=maxMes; m+=6) refMeses.push(m);

    const generateRef = (type: 'peso' | 'talla' | 'imc') => {
      return refMeses.map(m => {
        let p95, p50, p5;
        if(type === 'peso') {
          p95 = 3.5 + Math.sqrt(m) * 2.2;
          p50 = 3.2 + Math.sqrt(m) * 1.8;
          p5 = 2.5 + Math.sqrt(m) * 1.4;
        } else if(type === 'talla') {
          p95 = 50 + Math.sqrt(m) * 9;
          p50 = 49 + Math.sqrt(m) * 8;
          p5 = 46 + Math.sqrt(m) * 7;
        } else {
          p95 = 18 + (m > 24 ? 1 : 0);
          p50 = 16;
          p5 = 13 + (m > 24 ? -1 : 0);
        }
        return { x: m, p95, p50, p5 };
      });
    };

    const rPeso = generateRef('peso');
    const rTalla = generateRef('talla');
    const rIMC = generateRef('imc');

    this.updateChartData('pesoEdadChart', dataPaciente.map(d => ({x: d.x, y: d.y})), rPeso.map(r => ({x: r.x, y: r.p95})), rPeso.map(r => ({x: r.x, y: r.p50})), rPeso.map(r => ({x: r.x, y: r.p5})));
    this.updateChartData('tallaEdadChart', dataPaciente.map(d => ({x: d.x, y: d.talla})), rTalla.map(r => ({x: r.x, y: r.p95})), rTalla.map(r => ({x: r.x, y: r.p50})), rTalla.map(r => ({x: r.x, y: r.p5})));
    this.updateChartData('imcChart', dataPaciente.map(d => ({x: d.x, y: d.imc})), rIMC.map(r => ({x: r.x, y: r.p95})), rIMC.map(r => ({x: r.x, y: r.p50})), rIMC.map(r => ({x: r.x, y: r.p5})));
  }

  updateChartData(id: string, dataP: any[], refH: any[], refM: any[], refL: any[]) {
    const chart = this.charts[id];
    chart.data.datasets[0].data = refH;
    chart.data.datasets[1].data = refM;
    chart.data.datasets[2].data = refL;
    chart.data.datasets[3].data = dataP;
    chart.update();
  }
}
