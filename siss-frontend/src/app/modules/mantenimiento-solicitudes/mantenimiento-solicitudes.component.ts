import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudesService, SolicitudUsuario, EstadoSolicitud } from '../../core/services/solicitudes.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-mantenimiento-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mantenimiento-solicitudes.component.html'
})
export class MantenimientoSolicitudesComponent implements OnInit {
  private solicitudesService = inject(SolicitudesService);
  private notificationService = inject(NotificationService);

  solicitudes: SolicitudUsuario[] = [];
  filtro: EstadoSolicitud = 'PENDIENTE';
  
  solicitudSeleccionada: SolicitudUsuario | null = null;
  nuevoEstado: EstadoSolicitud | null = null;
  observaciones: string = '';

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.solicitudesService.listar(this.filtro).subscribe({
      next: (data) => this.solicitudes = data,
      error: (err) => {
        const msg = err.error?.message || 'Error al cargar solicitudes';
        this.notificationService.error(msg);
      }
    });
  }

  filtrar(estado: EstadoSolicitud) {
    this.filtro = estado;
    this.cargarSolicitudes();
  }

  abrirProcesar(s: SolicitudUsuario) {
    this.solicitudSeleccionada = s;
    this.nuevoEstado = null;
    this.observaciones = '';
  }

  confirmarProcesar() {
    if (!this.solicitudSeleccionada || !this.nuevoEstado) return;

    this.solicitudesService.procesar(this.solicitudSeleccionada.id, {
      estado: this.nuevoEstado,
      observaciones: this.observaciones
    }).subscribe({
      next: () => {
        this.notificationService.success(`Solicitud ${this.nuevoEstado?.toLowerCase()} correctamente`);
        this.solicitudSeleccionada = null;
        this.cargarSolicitudes();
      },
      error: (err) => {
        const msg = err.error?.message || 'No se pudo procesar la solicitud';
        this.notificationService.error(msg);
      }
    });
  }
}
