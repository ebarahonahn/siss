import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CaraDiente {
  estado: 'NORMAL' | 'CARIES' | 'OBTURADO' | 'RESTAURACION';
}

export interface DienteEstado {
  id: number;
  caras: {
    superior: CaraDiente;
    inferior: CaraDiente;
    izquierda: CaraDiente;
    derecha: CaraDiente;
    centro: CaraDiente;
  };
  ausente: boolean;
  protesis: boolean;
  corona: boolean;
  implante: boolean;
  brakets: boolean;
}

@Component({
  selector: 'app-odontograma',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './odontograma.component.html',
  styleUrls: ['./odontograma.component.css']
})
export class OdontogramaComponent implements OnInit, OnChanges {
  @Input() readonly: boolean = false;
  @Input() initialData: DienteEstado[] = [];
  @Input() edadPaciente: number | null = null;
  @Output() dataChanged = new EventEmitter<DienteEstado[]>();

  dientes = signal<DienteEstado[]>([]);
  selectedTooth = signal<number | null>(null);

  // ── Adulto (FDI permanente) ──
  cuadrante1 = [18, 17, 16, 15, 14, 13, 12, 11];
  cuadrante2 = [21, 22, 23, 24, 25, 26, 27, 28];
  cuadrante3 = [48, 47, 46, 45, 44, 43, 42, 41];
  cuadrante4 = [31, 32, 33, 34, 35, 36, 37, 38];

  // ── Pediátrico (FDI temporal) ──
  cuadrantePed1 = [55, 54, 53, 52, 51];
  cuadrantePed2 = [61, 62, 63, 64, 65];
  cuadrantePed3 = [85, 84, 83, 82, 81];
  cuadrantePed4 = [71, 72, 73, 74, 75];

  /** Edad límite para mostrar dentición temporal (estrictamente menor a 12 años) */
  get esPediatrico(): boolean {
    return this.edadPaciente !== null && this.edadPaciente < 12;
  }

  get cuadrantesActivos(): number[][] {
    return this.esPediatrico
      ? [this.cuadrantePed1, this.cuadrantePed2, this.cuadrantePed3, this.cuadrantePed4]
      : [this.cuadrante1, this.cuadrante2, this.cuadrante3, this.cuadrante4];
  }

  ngOnInit() {
    this.inicializarDientes();
    if (this.initialData && this.initialData.length > 0) {
      this.cargarDatos(this.initialData);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['edadPaciente']) {
      // Si cambia la edad reinicializamos los dientes con los cuadrantes correctos
      this.inicializarDientes();
      if (this.initialData && this.initialData.length > 0) {
        this.cargarDatos(this.initialData);
      }
    } else if (changes['initialData'] && !changes['initialData'].firstChange) {
      if (this.initialData && this.initialData.length > 0) {
        this.cargarDatos(this.initialData);
      }
    }
  }

  private todosLosIds(): number[] {
    if (this.esPediatrico) {
      return [
        ...this.cuadrantePed1, ...this.cuadrantePed2,
        ...this.cuadrantePed3, ...this.cuadrantePed4
      ];
    }
    return [
      ...this.cuadrante1, ...this.cuadrante2,
      ...this.cuadrante3, ...this.cuadrante4
    ];
  }

  private inicializarDientes() {
    const todos = this.todosLosIds();
    const inicial: DienteEstado[] = todos.map(id => ({
      id,
      caras: {
        superior:  { estado: 'NORMAL' },
        inferior:  { estado: 'NORMAL' },
        izquierda: { estado: 'NORMAL' },
        derecha:   { estado: 'NORMAL' },
        centro:    { estado: 'NORMAL' }
      },
      ausente:  false,
      protesis: false,
      corona:   false,
      implante: false,
      brakets:  false
    }));
    this.dientes.set(inicial);
  }

  private cargarDatos(data: DienteEstado[]) {
    const actual = this.dientes();
    data.forEach(d => {
      const idx = actual.findIndex(t => t.id === d.id);
      if (idx !== -1) {
        actual[idx] = { ...actual[idx], ...d };
      }
    });
    this.dientes.set([...actual]);
  }

  getDiente(id: number): DienteEstado {
    return this.dientes().find(d => d.id === id)!;
  }

  toggleCara(dienteId: number, cara: keyof DienteEstado['caras']) {
    if (this.readonly) return;

    const actual = this.dientes();
    const idx = actual.findIndex(d => d.id === dienteId);
    if (idx === -1) return;

    const diente = actual[idx];
    const estados: ('NORMAL' | 'CARIES' | 'OBTURADO' | 'RESTAURACION')[] = ['NORMAL', 'CARIES', 'OBTURADO', 'RESTAURACION'];
    const currentIdx = estados.indexOf(diente.caras[cara].estado);
    const nextIdx = (currentIdx + 1) % estados.length;
    
    diente.caras[cara].estado = estados[nextIdx];
    
    actual[idx] = { ...diente };
    this.dientes.set([...actual]);
    this.dataChanged.emit(actual);
  }

  toggleAusente(dienteId: number) {
    if (this.readonly) return;
    const actual = this.dientes();
    const idx = actual.findIndex(d => d.id === dienteId);
    actual[idx].ausente = !actual[idx].ausente;
    this.dientes.set([...actual]);
    this.dataChanged.emit(actual);
    this.selectedTooth.set(null);
  }

  toggleCorona(dienteId: number) {
    if (this.readonly) return;
    const actual = this.dientes();
    const idx = actual.findIndex(d => d.id === dienteId);
    actual[idx].corona = !actual[idx].corona;
    this.dientes.set([...actual]);
    this.dataChanged.emit(actual);
    this.selectedTooth.set(null);
  }

  toggleImplante(dienteId: number) {
    if (this.readonly) return;
    const actual = this.dientes();
    const idx = actual.findIndex(d => d.id === dienteId);
    actual[idx].implante = !actual[idx].implante;
    this.dientes.set([...actual]);
    this.dataChanged.emit(actual);
    this.selectedTooth.set(null);
  }

  toggleBrakets(dienteId: number) {
    if (this.readonly) return;
    const actual = this.dientes();
    const idx = actual.findIndex(d => d.id === dienteId);
    actual[idx].brakets = !actual[idx].brakets;
    this.dientes.set([...actual]);
    this.dataChanged.emit(actual);
    this.selectedTooth.set(null);
  }

  menuPosition = signal<{ x: number, y: number }>({ x: 0, y: 0 });

  toggleMenu(event: MouseEvent, dienteId: number) {
    if (this.readonly) return;
    event.preventDefault();
    
    if (this.selectedTooth() === dienteId) {
      this.selectedTooth.set(null);
    } else {
      this.selectedTooth.set(dienteId);
      this.menuPosition.set({ x: event.clientX, y: event.clientY });
    }
  }

  getColorCara(estado: string): string {
    switch (estado) {
      case 'CARIES':      return '#ef4444'; // Rojo (Pendiente)
      case 'OBTURADO':    return '#3b82f6'; // Azul (Existente/Realizado)
      case 'RESTAURACION': return '#10b981'; // Verde (Nuevo realizado en sesión)
      default:            return '#f3f4f6'; // Gris claro
    }
  }
}
