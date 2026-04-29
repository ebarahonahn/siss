import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    const camaDestino = await this.prisma.cama.findUnique({ where: { id: data.camaDestinoId } });
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
        data: { camaId: data.camaDestinoId }
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

  async obtenerEstadisticas(servicioId?: number) {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    // 1. Total de camas activas
    const totalCamas = await this.prisma.cama.count({
      where: { 
        activo: true,
        ...(servicioId && { habitacion: { sala: { servicioId } } })
      }
    });

    // 2. Ingresos activos (Ocupación actual)
    const ingresosActivosDetalle = await this.prisma.ingresoHospitalario.findMany({
      where: { 
        estado: 'ACTIVO',
        ...(servicioId && { servicioId })
      }
    });
    const ingresosActivos = ingresosActivosDetalle.length;

    // 3. Egresos del mes (para Giro de Cama)
    console.time('Stats:Egresos');
    const egresosMes = await this.prisma.egresoHospitalario.findMany({
      where: {
        fechaEgreso: { gte: inicioMes },
        ...(servicioId && { ingreso: { servicioId } })
      },
      include: { ingreso: true }
    });
    console.timeEnd('Stats:Egresos');
    console.log(`Egresos encontrados para estadísticas: ${egresosMes.length}`);

    // Cálculos
    const ocupacionPorcentual = totalCamas > 0 ? (ingresosActivos / totalCamas) * 100 : 0;
    const giroCama = totalCamas > 0 ? egresosMes.length / totalCamas : 0;
    
    let sumaEstadia = 0;
    egresosMes.forEach(e => {
      const diffTime = Math.abs(e.fechaEgreso.getTime() - e.ingreso.fechaIngreso.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      sumaEstadia += diffDays === 0 ? 1 : diffDays;
    });
    const promedioEstadia = egresosMes.length > 0 ? sumaEstadia / egresosMes.length : 0;

    console.log('Estadísticas calculadas:', { totalCamas, ingresosActivos, totalEgresos: egresosMes.length });

    // 4. Análisis por Servicio (Ocupación y Giro)
    const serviciosActivos = await this.prisma.servicio.findMany({
      where: { activo: true },
      include: { catServicio: true }
    });

    const analisisServiciosRaw = await Promise.all(serviciosActivos.map(async (s) => {
      // Contar camas activas en este servicio
      const camasServicio = await this.prisma.cama.count({
        where: { activo: true, habitacion: { sala: { servicioId: s.id } } }
      });
      
      // Si el servicio no tiene camas configuradas, lo ignoramos para la estadística
      if (camasServicio === 0) return null;

      // Contar ocupadas (ingresos activos)
      const ocupadasServicio = ingresosActivosDetalle.filter(i => i.servicioId === s.id).length;
      
      // Filtrar egresos del mes
      const egresosServicio = egresosMes.filter(e => e.ingreso.servicioId === s.id).length;

      return {
        servicio: s.catServicio.nombre,
        camas: camasServicio,
        ocupacion: camasServicio > 0 ? Math.round((ocupadasServicio / camasServicio) * 100) : 0,
        egresos: egresosServicio,
        giro: camasServicio > 0 ? Math.round((egresosServicio / camasServicio) * 100) / 100 : 0
      };
    }));

    // Filtrar nulos (servicios sin camas)
    const analisisServicios = analisisServiciosRaw.filter(s => s !== null);

    return {
      indicadores: {
        totalCamas,
        ingresosActivos,
        ocupacionPorcentual: Math.round(ocupacionPorcentual * 10) / 10,
        giroCama: Math.round(giroCama * 100) / 100,
        promedioEstadia: Math.round(promedioEstadia * 10) / 10,
        totalEgresosMes: egresosMes.length
      },
      tendenciaOcupacion: [
        { name: 'Ocupadas', value: ingresosActivos },
        { name: 'Disponibles', value: totalCamas - ingresosActivos }
      ],
      analisisServicios
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
