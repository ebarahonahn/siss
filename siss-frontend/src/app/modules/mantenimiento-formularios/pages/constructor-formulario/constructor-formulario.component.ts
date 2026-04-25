import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormulariosService } from '../../../../core/services/formularios.service';

@Component({
  selector: 'app-constructor-formulario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './constructor-formulario.component.html',
})
export class ConstructorFormularioComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(FormulariosService);

  plantilla: any = null;
  preview = false;
  campoEditando: any = null;
  nuevaOpcion = '';
  seccionActivaId = signal<number | null>(null);

  private TIPOS_CON_OPCIONES = ['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX_GRUPO'];

  tiposCampo = [
    { tipo: 'TEXTO',          etiqueta: 'Texto',      icono: '✏️' },
    { tipo: 'TEXTAREA',       etiqueta: 'Texto largo', icono: '📝' },
    { tipo: 'NUMERO',         etiqueta: 'Número',     icono: '🔢' },
    { tipo: 'DECIMAL',        etiqueta: 'Decimal',    icono: '📊' },
    { tipo: 'SELECT',         etiqueta: 'Lista',      icono: '📋' },
    { tipo: 'RADIO',          etiqueta: 'Opciones',   icono: '🔘' },
    { tipo: 'CHECKBOX_GRUPO', etiqueta: 'Checks',     icono: '☑️' },
    { tipo: 'BOOLEANO',       etiqueta: 'Sí/No',      icono: '🔀' },
    { tipo: 'FECHA',          etiqueta: 'Fecha',      icono: '📅' },
    { tipo: 'ESCALA',         etiqueta: 'Escala',     icono: '📏' },
    { tipo: 'SEPARADOR',      etiqueta: 'Separador',  icono: '➖' },
  ];

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar(id);
  }

  cargar(id: number) {
    this.service.obtenerPlantilla(id).subscribe((res: any) => {
      this.plantilla = res?.data;
      if (this.plantilla?.secciones?.length > 0) {
        this.seccionActivaId.set(this.plantilla.secciones[0].id);
      }
    });
  }

  seleccionarSeccion(id: number) {
    this.seccionActivaId.set(id);
  }

  activar() {
    this.service.activarPlantilla(this.plantilla.id).subscribe(() => {
      this.plantilla.activa = true;
    });
  }

  agregarSeccion() {
    this.service
      .crearSeccion({ plantillaId: this.plantilla.id, nombre: 'Nueva sección' })
      .subscribe((res: any) => {
        const nueva = { ...res.data, campos: [] };
        this.plantilla.secciones.push(nueva);
        this.seccionActivaId.set(nueva.id);
      });
  }

  guardarSeccion(seccion: any) {
    this.service.actualizarSeccion(seccion.id, { nombre: seccion.nombre }).subscribe();
  }

  eliminarSeccion(seccion: any, idx: number) {
    if (!confirm('¿Eliminar esta sección y todos sus campos?')) return;
    this.service.eliminarSeccion(seccion.id).subscribe(() => {
      this.plantilla.secciones.splice(idx, 1);
    });
  }

  agregarCampoASeccion(tipo: string, seccion: any) {
    this.service
      .crearCampo({ 
        seccionId: seccion.id, 
        plantillaId: this.plantilla.id, 
        tipo, 
        etiqueta: `Nuevo campo ${Date.now().toString().slice(-4)}` 
      })
      .subscribe((res: any) => {
        seccion.campos.push(res.data);
        this.campoEditando = { ...res.data };
      });
  }

  agregarCampoDesdeSidebar(tipo: string) {
    const sid = this.seccionActivaId();
    if (!sid) {
      if (this.plantilla?.secciones?.length > 0) {
        this.seccionActivaId.set(this.plantilla.secciones[0].id);
      } else {
        return; // No hay secciones para añadir
      }
    }
    
    const seccion = this.plantilla.secciones.find((s: any) => s.id == this.seccionActivaId());
    if (seccion) {
      this.agregarCampoASeccion(tipo, seccion);
    }
  }

  editarCampo(campo: any) {
    this.campoEditando = { ...campo };
    this.nuevaOpcion = '';
    if (this.tieneOpciones() && !this.campoEditando.configuracion) {
      this.campoEditando.configuracion = { opciones: [] };
    }
  }

  tieneOpciones(): boolean {
    return this.TIPOS_CON_OPCIONES.includes(this.campoEditando?.tipo);
  }

  getOpciones(): string[] {
    const cfg = this.campoEditando?.configuracion;
    if (!cfg) return [];
    const parsed = typeof cfg === 'string' ? JSON.parse(cfg) : cfg;
    return Array.isArray(parsed?.opciones) ? parsed.opciones : [];
  }

  agregarOpcion() {
    const val = this.nuevaOpcion.trim();
    if (!val) return;
    const ops = this.getOpciones();
    if (ops.includes(val)) return;
    this.campoEditando.configuracion = { ...(this.campoEditando.configuracion ?? {}), opciones: [...ops, val] };
    this.nuevaOpcion = '';
  }

  eliminarOpcion(i: number) {
    const ops = [...this.getOpciones()];
    ops.splice(i, 1);
    this.campoEditando.configuracion = { ...(this.campoEditando.configuracion ?? {}), opciones: ops };
  }

  guardarCampo() {
    this.service.actualizarCampo(this.campoEditando.id, this.campoEditando).subscribe((res: any) => {
      for (const sec of this.plantilla.secciones) {
        const idx = sec.campos.findIndex((c: any) => c.id === this.campoEditando.id);
        if (idx >= 0) { sec.campos[idx] = res.data; break; }
      }
      this.campoEditando = null;
    });
  }

  eliminarCampo(id: number, seccion: any, idx: number) {
    this.service.eliminarCampo(id).subscribe(() => {
      seccion.campos.splice(idx, 1);
    });
  }

  getAnchoClass(ancho: string): string {
    switch (ancho) {
      case 'CUARTO': return 'col-span-1';
      case 'TERCIO': return 'col-span-1 md:col-span-1 lg:col-span-1'; // Ajustado para grid de 3 o 4
      case 'MEDIO': return 'col-span-1 md:col-span-2';
      case 'COMPLETO': return 'col-span-1 md:col-span-4';
      default: return 'col-span-1 md:col-span-4';
    }
  }

  getIconoTipo(tipo: string): string {
    return this.tiposCampo.find(t => t.tipo === tipo)?.icono || '❓';
  }
}
