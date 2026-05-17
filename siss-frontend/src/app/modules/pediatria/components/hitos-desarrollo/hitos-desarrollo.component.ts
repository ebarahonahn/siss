import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-hitos-desarrollo',
  standalone: false,
  templateUrl: './hitos-desarrollo.component.html',
  styleUrls: ['./hitos-desarrollo.component.css']
})



export class HitosDesarrolloComponent implements OnInit, OnChanges {
  @Input() pacienteId!: number;
  @Input() controles: any[] = [];
  @Output() hitosCambiados = new EventEmitter<{ hitos: any, alerta: string }>();

  hitosPorEdad = [
    {
      rango: '0 - 2 Meses',
      hitos: [
        { nombre: 'Sostiene la cabeza', descripcion: 'Mantiene la cabeza erguida al estar boca abajo.', cumplido: false },
        { nombre: 'Sigue objetos', descripcion: 'Sigue con la mirada objetos en movimiento.', cumplido: false },
        { nombre: 'Sonrisa social', descripcion: 'Sonríe en respuesta a estímulos.', cumplido: false }
      ]
    },
    {
      rango: '6 Meses',
      hitos: [
        { nombre: 'Se sienta solo', descripcion: 'Mantiene el equilibrio al estar sentado.', cumplido: false },
        { nombre: 'Balbuceo', descripcion: 'Produce sonidos como "da-da" o "ma-ma".', cumplido: false },
        { nombre: 'Agarra objetos', descripcion: 'Usa toda la mano para tomar juguetes.', cumplido: false }
      ]
    },
    {
      rango: '12 Meses (1 Año)',
      hitos: [
        { nombre: 'Camina con apoyo', descripcion: 'Se desplaza sujetándose de muebles.', cumplido: false },
        { nombre: 'Primeras palabras', descripcion: 'Dice al menos una palabra con significado.', cumplido: false },
        { nombre: 'Pinza fina', descripcion: 'Usa el pulgar e índice para tomar objetos pequeños.', cumplido: false }
      ]
    },
    {
      rango: '24 Meses (2 Años)',
      hitos: [
        { nombre: 'Frases cortas', descripcion: 'Une dos o más palabras ("quiero agua").', cumplido: false },
        { nombre: 'Sube escalones', descripcion: 'Sube escalones con ayuda.', cumplido: false },
        { nombre: 'Juego simbólico', descripcion: 'Imita acciones cotidianas (ej: peinarse).', cumplido: false }
      ]
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.cargarHitosGuardados();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['controles'] && this.controles) {
      this.cargarHitosGuardados();
    }
  }

  cargarHitosGuardados() {
    if (!this.controles || this.controles.length === 0) return;
    
    const hitosCumplidosSet = new Set<string>();
    
    for (const c of this.controles) {
      const desarrollo = c.desarrolloJson;
      if (!desarrollo) continue;
      
      let parsedDesarrollo: any[] = [];
      if (typeof desarrollo === 'string') {
        try {
          parsedDesarrollo = JSON.parse(desarrollo);
        } catch (e) {
          console.error('Error al parsear desarrolloJson', e);
        }
      } else if (Array.isArray(desarrollo)) {
        parsedDesarrollo = desarrollo;
      }
      
      if (Array.isArray(parsedDesarrollo)) {
        for (const grupo of parsedDesarrollo) {
          if (grupo && Array.isArray(grupo.hitos)) {
            for (const hito of grupo.hitos) {
              if (hito && hito.cumplido && hito.nombre) {
                hitosCumplidosSet.add(hito.nombre.trim().toLowerCase());
              }
            }
          }
        }
      }
    }
    
    if (hitosCumplidosSet.size > 0) {
      for (const grupo of this.hitosPorEdad) {
        for (const hito of grupo.hitos) {
          const hitoNameKey = hito.nombre.trim().toLowerCase();
          if (hitosCumplidosSet.has(hitoNameKey)) {
            hito.cumplido = true;
          }
        }
      }
      this.evaluar();
    }
  }

  evaluar() {
    console.log('Evaluando hitos alcanzados...');
    let nivelAlerta = 'NORMAL';
    
    this.hitosCambiados.emit({
      hitos: this.hitosPorEdad,
      alerta: nivelAlerta 
    });
  }
}
