import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { PediatriaService } from '../../pediatria.service';

@Component({
  selector: 'app-carnet-vacunacion-pediatrico',
  standalone: false,
  templateUrl: './carnet-vacunacion-pediatrico.component.html',
  styleUrls: ['./carnet-vacunacion-pediatrico.component.css']
})


export class CarnetVacunacionPediatricoComponent implements OnInit, OnChanges {
  @Input() pacienteId!: number;
  @Input() edadMeses: number = 0;
  @Input() paciente: any;
  
  roadmap: any[] = [];
  mostrarModalRegistro = false;
  vacunaSeleccionadaId?: number;
  esquemaSeleccionadoId?: number;

  constructor(private pediatriaService: PediatriaService) { }

  abrirRegistro(vacunaId: number, esquemaId: number) {
    this.vacunaSeleccionadaId = vacunaId;
    this.esquemaSeleccionadoId = esquemaId;
    this.mostrarModalRegistro = true;
  }

  ngOnInit(): void {
    if (this.pacienteId) {
      this.cargarRoadmap();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pacienteId'] && !changes['pacienteId'].firstChange) {
      this.cargarRoadmap();
    }
  }

  cargarRoadmap() {
    this.pediatriaService.getRoadmapVacunacion(this.pacienteId).subscribe({
      next: (data: any) => {
        this.roadmap = Array.isArray(data) ? data : (data.data || []);
      },
      error: (err: any) => console.error('Error al cargar roadmap de vacunas', err)
    });
  }


  getEtiquetaEdad(meses: number): string {
    if (meses === 0) return 'Recién Nacido';
    if (meses < 12) return `${meses} meses`;
    if (meses % 12 === 0) return `${meses / 12} ${meses / 12 === 1 ? 'año' : 'años'}`;
    return `${Math.floor(meses / 12)}a ${meses % 12}m`;
  }

  esAtrasada(mesesRecomendados: number): boolean {
    // Si la edad actual supera el mes recomendado por más de 1 mes y no está aplicada
    return this.edadMeses > mesesRecomendados + 1;
  }
}
