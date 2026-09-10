import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DateUtils } from '../../common/utils/date-utils';
import { 
  CreateSalaDto, UpdateSalaDto, 
  CreateHabitacionDto, UpdateHabitacionDto, 
  CreateCamaDto, UpdateCamaDto,
  CreateIngresoDto, CreateEgresoDto, CreateMovimientoDto,
  CreateNotaEvolucionDto, CreateKardexDto, CreateControlSignosDto
} from './dto/hospitalizacion.dto';

@Injectable()
export class HospitalizacionService {
  constructor(private prisma: PrismaService) {}

  // ── SALAS ────────────────────────────────────────────────────────────────
  async listarSalas(servicioId: number) {
    return this.prisma.sala.findMany({
      where: { servicioId, activo: true },
      include: {
        _count: {
          select: { habitaciones: true }
        }
      }
    });
  }

  async crearSala(data: CreateSalaDto) {
    return this.prisma.sala.create({ data });
  }

  async actualizarSala(id: number, data: UpdateSalaDto) {
    return this.prisma.sala.update({ where: { id }, data });
  }

  async eliminarSala(id: number) {
    const count = await this.prisma.habitacion.count({ where: { salaId: id } });
    if (count > 0) throw new ConflictException('No se puede eliminar una sala que tiene piezas');
    return this.prisma.sala.update({ where: { id }, data: { activo: false } });
  }

  // ── HABITACIONES ─────────────────────────────────────────────────────────
  async listarHabitaciones(salaId: number) {
    return this.prisma.habitacion.findMany({
      where: { salaId, activo: true },
      include: {
        tipoHabitacion: true,
        _count: {
          select: { camas: true }
        }
      }
    });
  }

  async crearHabitacion(data: CreateHabitacionDto) {
    return this.prisma.habitacion.create({ data });
  }

  async actualizarHabitacion(id: number, data: UpdateHabitacionDto) {
    return this.prisma.habitacion.update({ where: { id }, data });
  }

  async eliminarHabitacion(id: number) {
    const count = await this.prisma.cama.count({ where: { habitacionId: id } });
    if (count > 0) throw new ConflictException('No se puede eliminar una pieza que tiene camas');
    return this.prisma.habitacion.update({ where: { id }, data: { activo: false } });
  }

  // ── CAMAS ────────────────────────────────────────────────────────────────
  async listarCamas(habitacionId: number) {
    return this.prisma.cama.findMany({
      where: { habitacionId, activo: true },
      include: {
        tipoCama: true
      }
    });
  }

  async crearCama(data: CreateCamaDto) {
    const existe = await this.prisma.cama.findUnique({ where: { codigo: data.codigo } });
    if (existe) throw new ConflictException('Ya existe una cama con ese código');
    return this.prisma.cama.create({ data });
  }

  async actualizarCama(id: number, data: UpdateCamaDto) {
    return this.prisma.cama.update({ where: { id }, data });
  }

  async eliminarCama(id: number) {
    return this.prisma.cama.update({ where: { id }, data: { activo: false } });
  }

  // ── CATÁLOGOS ────────────────────────────────────────────────────────────
  async listarTiposHabitacion() {
    return this.prisma.catTipoHabitacion.findMany();
  }

  async listarTiposCama() {
    return this.prisma.catTipoCama.findMany();
  }

  // ── ADMISIÓN Y EGRESOS ───────────────────────────────────────────────────

  async admitirPaciente(data: CreateIngresoDto) {
    // 1. Verificar si la cama está disponible
    const cama = await this.prisma.cama.findUnique({ where: { id: data.camaId } });
    if (!cama) throw new NotFoundException('Cama no encontrada');
    if (cama.estado !== 'DISPONIBLE') {
      throw new ConflictException('La cama no está disponible para asignación (Estado: ' + cama.estado + ')');
    }

    // 2. Crear el ingreso y actualizar la cama en una transacción
    return this.prisma.$transaction(async (tx) => {
      const ingreso = await tx.ingresoHospitalario.create({
        data: {
          ...data,
          fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : DateUtils.getLiteralNow(),
          estado: 'ACTIVO'
        }
      });

      await tx.cama.update({
        where: { id: data.camaId },
        data: { estado: 'OCUPADA' }
      });

      return ingreso;
    });
  }

  async listarIngresosActivos(servicioId?: number) {
    return this.prisma.ingresoHospitalario.findMany({
      where: {
        estado: 'ACTIVO',
        ...(servicioId && { servicioId })
      },
      include: {
        paciente: {
          select: {
            id: true,
            numeroExpediente: true,
            nombres: true,
            apellidos: true,
            dni: true
          }
        },
        cama: {
          include: {
            habitacion: {
              include: {
                sala: true
              }
            }
          }
        },
        medicoIngreso: {
          select: { nombres: true, apellidos: true }
        }
      },
      orderBy: { fechaIngreso: 'desc' }
    });
  }

  async obtenerIngresoConDetalle(id: number) {
    const ingreso = await this.prisma.ingresoHospitalario.findUnique({
      where: { id },
      include: {
        paciente: true,
        cama: {
          include: {
            habitacion: {
              include: {
                sala: {
                  include: {
                    servicio: {
                      include: {
                        catServicio: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!ingreso) throw new NotFoundException('Ingreso no encontrado');
    return ingreso;
  }

  async registrarEgreso(data: CreateEgresoDto) {
    const ingreso = await this.prisma.ingresoHospitalario.findUnique({
      where: { id: data.ingresoId },
      include: { cama: true }
    });

    if (!ingreso || ingreso.estado !== 'ACTIVO') {
      throw new NotFoundException('Ingreso activo no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const egreso = await tx.egresoHospitalario.create({ 
        data: {
          ...data,
          fechaEgreso: data.fechaEgreso ? new Date(data.fechaEgreso) : DateUtils.getLiteralNow()
        }
      });

      await tx.ingresoHospitalario.update({
        where: { id: data.ingresoId },
        data: { estado: 'EGRESADO' }
      });

      // Al salir, la cama pasa a LIMPIEZA
      await tx.cama.update({
        where: { id: ingreso.camaId },
        data: { estado: 'LIMPIEZA' }
      });

      return egreso;
    });
  }

  async trasladarPaciente(data: CreateMovimientoDto) {
    const ingreso = await this.prisma.ingresoHospitalario.findUnique({
      where: { id: data.ingresoId }
    });

    if (!ingreso || ingreso.estado !== 'ACTIVO') {
      throw new NotFoundException('Ingreso activo no encontrado');
    }

    // Validar destino
    const camaDestino = await this.prisma.cama.findUnique({
      where: { id: data.camaDestinoId },
      include: { habitacion: { include: { sala: true } } },
    });
    if (!camaDestino || camaDestino.estado !== 'DISPONIBLE') {
      throw new ConflictException('Cama de destino no disponible');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Crear registro de movimiento
      const movimiento = await tx.movimientoHospitalario.create({ 
        data: {
          ...data,
          fechaMovimiento: data.fechaMovimiento ? new Date(data.fechaMovimiento) : DateUtils.getLiteralNow()
        }
      });

      // 2. Actualizar cama origen -> LIMPIEZA
      await tx.cama.update({
        where: { id: data.camaOrigenId },
        data: { estado: 'LIMPIEZA' }
      });

      // 3. Actualizar cama destino -> OCUPADA
      await tx.cama.update({
        where: { id: data.camaDestinoId },
        data: { estado: 'OCUPADA' }
      });

      // 4. Actualizar el ingreso con la nueva cama
      await tx.ingresoHospitalario.update({
        where: { id: data.ingresoId },
        data: { camaId: data.camaDestinoId, servicioId: camaDestino.habitacion.sala.servicioId }
      });

      return movimiento;
    });
  }

  async listarCamasDisponibles(servicioId?: number) {
    console.log('Listando camas para servicioId:', servicioId);
    const camas = await this.prisma.cama.findMany({
      where: {
        activo: true,
        estado: 'DISPONIBLE',
        habitacion: {
          sala: servicioId ? { servicioId } : {}
        }
      },
      include: {
        habitacion: {
          include: {
            sala: true
          }
        }
      }
    });
    console.log(`Camas encontradas para servicio ${servicioId ?? 'TODOS'}:`, camas.length);
    return camas;
  }

  async listarHistorialEgresos(servicioId?: number) {
    return this.prisma.egresoHospitalario.findMany({
      where: servicioId ? { ingreso: { servicioId } } : {},
      include: {
        ingreso: {
          include: {
            paciente: true,
            cama: { include: { habitacion: { include: { sala: true } } } },
          },
        },
        medicoEgreso: true,
      },
      orderBy: { fechaEgreso: 'desc' },
      take: 50,
    });
  }

  async registrarNotaEvolucion(data: CreateNotaEvolucionDto) {
    return this.prisma.notaEvolucion.create({
      data: {
        ingresoId: data.ingresoId,
        nota: data.nota,
        fecha: data.fecha ? new Date(data.fecha) : DateUtils.getLiteralNow(),
        frecuenciaCardiaca: data.frecuenciaCardiaca,
        frecuenciaRespiratoria: data.frecuenciaRespiratoria,
        presionArterial: data.presionArterial,
        temperatura: data.temperatura,
        saturacionOxigeno: data.saturacionOxigeno,
        medicoId: data.medicoId,
      },
      include: {
        medico: {
          select: { nombres: true, apellidos: true }
        }
      }
    });
  }

  // ── KARDEX Y SIGNOS VITALES ──────────────────────────────────────────────

  async listarKardex(ingresoId: number) {
    return this.prisma.kardexMedicamento.findMany({
      where: { ingresoId },
      include: {
        medicamento: true,
        enfermera: { select: { nombres: true, apellidos: true } }
      },
      orderBy: { fechaProgramada: 'desc' }
    });
  }

  async registrarAdministracion(data: CreateKardexDto) {
    return this.prisma.kardexMedicamento.create({
      data: {
        ...data,
        fechaProgramada: new Date(data.fechaProgramada),
        fechaAplicacion: data.estado === 'ADMINISTRADO' 
          ? (data.fechaAplicacion ? new Date(data.fechaAplicacion) : DateUtils.getLiteralNow()) 
          : null
      },
      include: {
        medicamento: true,
        enfermera: { select: { nombres: true, apellidos: true } }
      }
    });
  }

  async listarSignosVitales(ingresoId: number) {
    return this.prisma.controlSignosVitales.findMany({
      where: { ingresoId },
      include: {
        usuario: { select: { nombres: true, apellidos: true } }
      },
      orderBy: { fecha: 'desc' }
    });
  }

  async registrarSignosVitales(data: CreateControlSignosDto) {
    return this.prisma.controlSignosVitales.create({
      data: {
        ...data,
        fecha: data.fecha ? new Date(data.fecha) : DateUtils.getLiteralNow()
      },
      include: {
        usuario: { select: { nombres: true, apellidos: true } }
      }
    });
  }

  async listarNotasEvolucion(ingresoId: number) {
    return this.prisma.notaEvolucion.findMany({
      where: { ingresoId },
      include: { medico: { select: { nombres: true, apellidos: true } } },
      orderBy: { fecha: 'desc' }
    });
  }

  async obtenerMapaCamas(establecimientoId: number) {
    return this.prisma.servicio.findMany({
      where: { 
        activo: true,
        establecimientoId,
        salas: { some: { activo: true } }
      },
      include: {
        catServicio: true,
        salas: {
          where: { activo: true },
          include: {
            habitaciones: {
              where: { activo: true },
              include: {
                camas: {
                  where: { activo: true },
                  include: {
                    ingresos: {
                      where: { estado: 'ACTIVO' },
                      include: { paciente: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async obtenerEstadisticas(establecimientoId: number, servicioId?: number) {
    if (!Number.isInteger(establecimientoId) || establecimientoId <= 0) {
      throw new BadRequestException('Debe seleccionar un establecimiento');
    }
    if (servicioId !== undefined && (!Number.isInteger(servicioId) || servicioId <= 0)) {
      throw new BadRequestException('Servicio inválido');
    }
    const ahora = DateUtils.getLiteralNow();
    const inicioMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
    const filtroServicio = { establecimientoId, ...(servicioId !== undefined ? { id: servicioId } : {}) };
    const [camas, egresosMes] = await this.prisma.$transaction([
      this.prisma.cama.findMany({
        where: { activo: true, habitacion: { sala: { servicio: filtroServicio } } },
        include: { habitacion: { include: { sala: { include: { servicio: { include: { catServicio: true } } } } } } },
      }),
      this.prisma.egresoHospitalario.findMany({
        where: {
          fechaEgreso: { gte: inicioMes, lte: ahora },
          ingreso: { cama: { habitacion: { sala: { servicio: filtroServicio } } } },
        },
        include: { ingreso: { include: { cama: { include: { habitacion: { include: { sala: true } } } } } } },
      }),
    ]);
    const totalCamas = camas.length;
    const ocupadas = camas.filter(c => c.estado === 'OCUPADA').length;
    const estados = [
      ['OCUPADA', 'Ocupadas'], ['DISPONIBLE', 'Disponibles'], ['LIMPIEZA', 'En limpieza'],
      ['MANTENIMIENTO', 'En mantenimiento'], ['RESERVADA', 'Reservadas'],
    ];
    const estadias = egresosMes.map(e => (e.fechaEgreso.getTime() - e.ingreso.fechaIngreso.getTime()) / 86400000);
    const validas = estadias.filter(d => Number.isFinite(d) && d >= 0);
    const promedioEstadia = validas.length ? Math.round(validas.reduce((a, b) => a + b, 0) / validas.length * 10) / 10 : null;
    // La cama actual (o última al egresar) determina el servicio, incluso tras un traslado.
    const servicios = new Map<number, { servicio: string; camas: number; ocupadas: number; egresos: number }>();
    for (const cama of camas) {
      const servicio = cama.habitacion.sala.servicio;
      const fila = servicios.get(servicio.id) ?? { servicio: servicio.catServicio.nombre, camas: 0, ocupadas: 0, egresos: 0 };
      fila.camas++;
      if (cama.estado === 'OCUPADA') fila.ocupadas++;
      servicios.set(servicio.id, fila);
    }
    for (const egreso of egresosMes) {
      const id = egreso.ingreso.cama.habitacion.sala.servicioId;
      if (!servicios.has(id)) {
        const servicio = await this.prisma.servicio.findUnique({ where: { id }, include: { catServicio: true } });
        servicios.set(id, { servicio: servicio?.catServicio.nombre ?? 'Servicio', camas: 0, ocupadas: 0, egresos: 0 });
      }
      servicios.get(id)!.egresos++;
    }
    return {
      periodo: { desde: inicioMes, hasta: ahora },
      indicadores: {
        totalCamas, ingresosActivos: ocupadas,
        ocupacionPorcentual: totalCamas ? Math.round(ocupadas / totalCamas * 1000) / 10 : 0,
        giroCama: totalCamas ? Math.round(egresosMes.length / totalCamas * 100) / 100 : null,
        promedioEstadia, estadiasInvalidas: estadias.length - validas.length,
        totalEgresosMes: egresosMes.length,
      },
      tendenciaOcupacion: estados.map(([estado, name]) => ({ name, value: camas.filter(c => c.estado === estado).length })),
      analisisServicios: [...servicios.values()].map(s => ({
        ...s, ocupacion: s.camas ? Math.round(s.ocupadas / s.camas * 1000) / 10 : 0,
        giro: s.camas ? Math.round(s.egresos / s.camas * 100) / 100 : null,
      })),
    };
  }
  async liberarCama(id: number) {
    const cama = await this.prisma.cama.findUnique({ where: { id } });
    if (!cama) throw new NotFoundException('Cama no encontrada');
    
    return this.prisma.cama.update({
      where: { id },
      data: { estado: 'DISPONIBLE' }
    });
  }
}

