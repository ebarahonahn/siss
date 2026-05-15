import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

export interface HistoriaClinica {
  id: number;
  pacienteId: number;
  medicoId: number;
  fecha: string;
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
  presionSistolica?: number;
  presionDiastolica?: number;
  frecuenciaCardiaca?: number;
  temperatura?: number;
  peso?: number;
  talla?: number;
  saturacionO2?: number;
  medico: {
    nombres: string;
    apellidos: string;
    numeroColegiado?: string;
    especialidad?: { nombre: string };
    establecimiento?: { nombre: string };
  };
  paciente?: {
    nombres: string;
    apellidos: string;
    fechaNacimiento: string;
    sexo: string;
  };
  diagnosticos: any[];
  recetas?: any[];
  solicitudesLab?: any[];
  solicitudesRad?: any[];
  incapacidades?: any[];
  referidos?: any[];
  respuestaFormulario?: {
    respuestas: any;
    plantilla: {
      nombre: string;
      secciones: any[];
    };
  };
  proximaCitaId?: number;
  proximaCita?: {
    id: number;
    fechaHora: string;
    tipo: string;
    motivo?: string;
  };
  controlPrenatal?: {
    id: number;
    embarazoId: number;
    semanasGestacion: number;
  };
}

@Injectable({ providedIn: 'root' })
export class HistoriaClinicaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/historia-clinica`;

  crear(datos: any): Observable<HistoriaClinica> {
    return this.http.post<ApiResponse<HistoriaClinica>>(this.base, datos)
      .pipe(map(res => res.data));
  }

  listarPorPaciente(pacienteId: number): Observable<HistoriaClinica[]> {
    return this.http.get<ApiResponse<HistoriaClinica[]>>(`${this.base}/paciente/${pacienteId}`)
      .pipe(map(res => res.data));
  }

  obtenerDetalle(id: number): Observable<HistoriaClinica> {
    return this.http.get<ApiResponse<HistoriaClinica>>(`${this.base}/${id}`)
      .pipe(map(res => res.data));
  }
}
