import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendasService, AgendaBase, ExcepcionAgenda } from './agendas.service';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService, UsuarioResumen } from '../../core/services/usuarios.service';
import { NotificationService } from '../../core/services/notification.service';
import { EstablecimientosService } from '../../core/services/establecimientos.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-agendas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agendas.component.html',
  styleUrls: ['./agendas.component.css']
})
export class AgendasComponent implements OnInit {
  agendaBase: AgendaBase[] = [];
  excepciones: ExcepcionAgenda[] = [];
  medicoId: number = 0;
  medicos: any[] = [];
  establecimientos: any[] = [];
  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;
  cargando: boolean = false;
  establecimientoId: number = 0;
  
  // Calendario
  viewDate = new Date();
  diasMes: any[] = [];
  meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  // Modal de Confirmación
  showConfirmModal = false;
  confirmConfig = {
    titulo: '',
    mensaje: '',
    accion: () => {}
  };
  
  private destroy$ = new Subject<void>();

  diasSemana = [
    { id: 1, nombre: 'Lunes' },
    { id: 2, nombre: 'Martes' },
    { id: 3, nombre: 'Miércoles' },
    { id: 4, nombre: 'Jueves' },
    { id: 5, nombre: 'Viernes' },
    { id: 6, nombre: 'Sábado' },
    { id: 0, nombre: 'Domingo' }
  ];

  nuevaExcepcion: ExcepcionAgenda = {
    medicoId: 0,
    establecimientoId: 0,
    tipo: 'VACACIONES_NORMALES',
    fechaInicio: '',
    fechaFin: '',
    descripcion: ''
  };

  constructor(
    private agendasService: AgendasService,
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private establecimientosService: EstablecimientosService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    const user = this.authService.obtenerUsuario();
    if (user) {
      // Usar sistema de permisos en lugar de roles hardcodeados
      this.isSuperAdmin = user.permisos.includes('all'); 
      this.isAdmin = user.permisos.includes('agendas:gestionar') || this.isSuperAdmin;
      
      this.medicoId = user.id;
      this.establecimientoId = user.establecimientoId;
      this.nuevaExcepcion.medicoId = user.id;
      this.nuevaExcepcion.establecimientoId = user.establecimientoId;
      
      if (this.isSuperAdmin) {
        this.cargarEstablecimientos();
      }

      if (this.isAdmin) {
        this.cargarMedicos();
      } else {
        // Si no es gestor, cargar solo su propia agenda
        this.onMedicoChange();
      }
      
      this.generarCalendario();
      this.cargarAgenda();
    }
  }

  generarCalendario() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const primerDia = new Date(year, month, 1).getDay();
    const totalDias = new Date(year, month + 1, 0).getDate();
    
    // Ajustar primer día (0=Dom, 1=Lun)
    const offset = primerDia === 0 ? 6 : primerDia - 1;
    
    this.diasMes = [];
    
    // Espacios vacíos al inicio
    for (let i = 0; i < offset; i++) {
      this.diasMes.push(null);
    }
    
    // Días del mes
    for (let i = 1; i <= totalDias; i++) {
      this.diasMes.push(new Date(year, month, i));
    }
  }

  cambiarMes(delta: number) {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + delta, 1);
    this.generarCalendario();
  }

  cargarEstablecimientos() {
    this.establecimientosService.listar().subscribe(docs => {
      this.establecimientos = docs;
    });
  }

  onEstablecimientoChange() {
    this.medicoId = 0;
    this.medicos = [];
    this.agendaBase = [];
    this.excepciones = [];
    this.nuevaExcepcion.establecimientoId = this.establecimientoId;
    this.cargarMedicos();
  }

  cargarMedicos() {
    this.usuariosService.listarMedicos(this.establecimientoId).subscribe(medicos => {
      this.medicos = medicos;
      if (this.medicos.length > 0 && !this.medicoId) {
        this.medicoId = this.medicos[0].id;
        this.onMedicoChange();
      }
    });
  }

  onMedicoChange() {
    this.nuevaExcepcion.medicoId = this.medicoId;
    this.nuevaExcepcion.establecimientoId = this.establecimientoId;
    this.cargarAgenda();
  }

  cargarAgenda() {
    if (!this.medicoId || !this.establecimientoId) return;
    this.cargando = true;
    this.agendasService.getAgendaMedico(this.medicoId, this.establecimientoId).subscribe({
      next: (res) => {
        this.agendaBase = res?.base || [];
        this.excepciones = res?.excepciones || [];
        this.cargando = false;
        this.generarCalendario();
      },
      error: () => {
        this.cargando = false;
        this.notificationService.error('Error al cargar la agenda');
      }
    });
  }

  getHorarioDia(diaId: number) {
    return this.agendaBase.find(a => a.diaSemana === diaId);
  }

  guardarHorario(diaId: number, horaInicio: string, horaFin: string) {
    // Validar duración de 6 horas
    const [h1, m1] = (horaInicio || '').split(':').map(Number);
    const [h2, m2] = (horaFin || '').split(':').map(Number);
    
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return;

    const min1 = h1 * 60 + m1;
    const min2 = h2 * 60 + m2;
    const duracion = min2 - min1;

    if (duracion !== 360) {
      this.notificationService.warn('La jornada laboral debe ser exactamente de 6 horas (360 minutos).');
      // No bloqueamos, pero advertimos (o podríamos bloquear si fuera estricto)
    }

    const agenda: AgendaBase = {
      medicoId: Number(this.medicoId),
      establecimientoId: this.establecimientoId,
      diaSemana: diaId,
      horaInicio,
      horaFin,
      activo: true
    };
    this.agendasService.upsertAgendaBase(agenda).subscribe(() => {
      this.notificationService.success('Horario guardado');
      this.cargarAgenda();
    });
  }

  desactivarHorario(diaId: number) {
    this.confirmConfig = {
      titulo: '¿Quitar Jornada?',
      mensaje: '¿Está seguro de que desea eliminar la jornada base de este día? Esta acción no se puede deshacer.',
      accion: () => {
        this.agendasService.deleteAgendaBase(Number(this.medicoId), this.establecimientoId, diaId).subscribe(() => {
          this.notificationService.success('Jornada eliminada');
          this.cargarAgenda();
        });
      }
    };
    this.showConfirmModal = true;
  }

  agregarExcepcion() {
    if (!this.nuevaExcepcion.fechaInicio || !this.nuevaExcepcion.fechaFin) {
      this.notificationService.warn('Debe completar las fechas');
      return;
    }
    const payload = {
      ...this.nuevaExcepcion,
      medicoId: Number(this.medicoId),
      establecimientoId: this.establecimientoId
    };
    this.agendasService.createExcepcion(payload).subscribe(() => {
      this.notificationService.success('Ausencia registrada correctamente');
      this.cargarAgenda();
      this.nuevaExcepcion = {
        medicoId: this.medicoId,
        establecimientoId: this.establecimientoId,
        tipo: 'VACACIONES_NORMALES',
        fechaInicio: '',
        fechaFin: '',
        descripcion: ''
      };
    });
  }

  eliminarExcepcion(id: number) {
    this.confirmConfig = {
      titulo: '¿Eliminar Ausencia?',
      mensaje: '¿Está seguro de que desea eliminar este registro de ausencia?',
      accion: () => {
        this.agendasService.deleteExcepcion(id).subscribe(() => {
          this.notificationService.success('Ausencia eliminada');
          this.cargarAgenda();
        });
      }
    };
    this.showConfirmModal = true;
  }

  getDiaClase(dia: Date | null): string {
    if (!dia) return 'bg-gray-50/50';
    
    // Formatear dia actual a YYYY-MM-DD local
    const diaStr = this.formatDateLocal(dia);
    const diaSemana = dia.getDay(); // 0=Dom, 1=Lun
    
    const tieneBase = this.agendaBase.some(a => a.diaSemana === diaSemana && a.activo);
    
    // Verificar si hay excepción comparando strings YYYY-MM-DD
    const tieneExcepcion = this.excepciones.some(e => {
      // Extraer solo la parte YYYY-MM-DD de la ISO string del servidor
      const inicio = e.fechaInicio.split('T')[0];
      const fin = e.fechaFin.split('T')[0];
      return diaStr >= inicio && diaStr <= fin;
    });

    if (tieneExcepcion) return 'bg-red-50 border-red-200 text-red-700';
    if (tieneBase) return 'bg-blue-50 border-blue-200 text-blue-700 font-bold';
    
    return 'bg-white border-gray-100 text-gray-400';
  }

  formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getHorarioTexto(dia: Date | null): string {
    if (!dia) return '';
    const diaSemana = dia.getDay();
    const horario = this.agendaBase.find(a => a.diaSemana === diaSemana && a.activo);
    return horario ? `${horario.horaInicio} - ${horario.horaFin}` : '';
  }

  getBadgeClass(tipo: string) {
    switch(tipo) {
      case 'VACACIONES_PROFILACTICAS': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'VACACIONES_NORMALES': return 'bg-green-100 text-green-800 border-green-200';
      case 'CURSO_CONGRESO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INCAPACIDAD': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
}
