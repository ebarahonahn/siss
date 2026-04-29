import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EpidemiologiaService {
  constructor(private prisma: PrismaService) {}

  async crearNotificacion(dto: any, usuarioId: number) {
    const { historiaId, pacienteId, ...datos } = dto;

    // Verificar que la historia clínica existe
    const historia = await this.prisma.historiaClinica.findUnique({
      where: { id: historiaId },
      include: { paciente: true },
    });

    if (!historia) {
      throw new NotFoundException(`Historia clínica ${historiaId} no encontrada`);
    }

    return this.prisma.notificacionEpidemiologica.create({
      data: {
        ...datos,
        historiaId,
        pacienteId: pacienteId || historia.pacienteId,
        creadoPorId: usuarioId,
        fechaInicioSintomas: datos.fechaInicioSintomas
          ? new Date(datos.fechaInicioSintomas)
          : undefined,
      },
    });
  }

  async obtenerPorHistoria(historiaId: number) {
    return this.prisma.notificacionEpidemiologica.findUnique({
      where: { historiaId },
      include: {
        paciente: {
          select: {
            nombres: true,
            apellidos: true,
            numeroExpediente: true,
            dni: true,
          },
        },
      },
    });
  }

  async listarNotificaciones(establecimientoId?: number) {
    return this.prisma.notificacionEpidemiologica.findMany({
      where: establecimientoId ? {
        historia: {
          medico: {
            establecimientoId,
          },
        },
      } : {},
      include: {
        paciente: {
          select: {
            nombres: true,
            apellidos: true,
            numeroExpediente: true,
          },
        },
        historia: {
          select: {
            fecha: true,
            medico: {
              select: {
                nombres: true,
                apellidos: true,
                establecimiento: { select: { nombre: true } },
              },
            },
          },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async obtenerMapaCalor() {
    const notificaciones = await this.prisma.notificacionEpidemiologica.findMany({
      where: {
        latitud: { not: null },
        longitud: { not: null },
      },
      select: {
        id: true,
        latitud: true,
        longitud: true,
        diagnosticoCIE10: true,
        creadoEn: true,
        estado: true,
        paciente: {
          select: { nombres: true, apellidos: true, numeroExpediente: true }
        },
        historia: {
          select: {
            medico: {
              select: {
                establecimiento: { select: { nombre: true } }
              }
            }
          }
        }
      },
    });

    return notificaciones.map(n => ({
      id: n.id,
      lat: Number(n.latitud),
      lng: Number(n.longitud),
      dx: n.diagnosticoCIE10 || 'N/A',
      fecha: n.creadoEn,
      estado: n.estado || 'PENDIENTE',
      paciente: n.paciente ? `${n.paciente.nombres} ${n.paciente.apellidos}` : 'PACIENTE SIN NOMBRE',
      expediente: n.paciente?.numeroExpediente || 'N/A',
      establecimiento: n.historia?.medico?.establecimiento?.nombre || 'ESTABLECIMIENTO NO REGISTRADO'
    }));
  }

  async obtenerCanalEndemico(anio: number = new Date().getFullYear()) {
    // Agrupar casos por semana epidemiológica del año actual
    const casos = await this.prisma.historiaClinica.groupBy({
      by: ['semanaEpidemiologica'],
      where: {
        fecha: {
          gte: new Date(`${anio}-01-01`),
          lte: new Date(`${anio}-12-31`),
        },
        notificacionEpidemiologica: { isNot: null },
      },
      _count: { id: true },
      orderBy: { semanaEpidemiologica: 'asc' },
    });

    // Simulación de promedio histórico (para propósitos de demostración en Honduras)
    // En un sistema real, esto vendría de datos de años anteriores (2020-2025)
    const historico = Array.from({ length: 52 }, (_, i) => ({
      semana: i + 1,
      promedio: Math.floor(Math.random() * 20) + 10,
      alerta: Math.floor(Math.random() * 40) + 30,
    }));

    return {
      actual: casos.map(c => ({ semana: c.semanaEpidemiologica, total: c._count.id })),
      historico,
    };
  }

  async obtenerResumenDiagnosticos() {
    const resumen = await this.prisma.notificacionEpidemiologica.groupBy({
      by: ['diagnosticoCIE10'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const codigos = resumen.map(r => r.diagnosticoCIE10);
    const catalogos = await this.prisma.catDiagnostico.findMany({
      where: { codigo: { in: codigos } },
      select: { codigo: true, descripcion: true }
    });

    return resumen.map(r => ({
      codigo: r.diagnosticoCIE10,
      nombre: catalogos.find(c => c.codigo === r.diagnosticoCIE10)?.descripcion || 'Sin descripción',
      total: r._count.id
    }));
  }

  async obtenerAlertasTiempo() {
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Buscamos diagnósticos que sean de notificación inmediata
    const dxInmediatos = await this.prisma.catDiagnostico.findMany({
      where: { notificacionInmediata: true },
      select: { codigo: true },
    });

    const codigosInmediatos = dxInmediatos.map(d => d.codigo);

    // Notificaciones inmediatas que llevan más de 24 horas y no han sido "validadas" o simplemente existen
    // (Asumimos que 'creadoEn' es el tiempo de registro)
    return this.prisma.notificacionEpidemiologica.findMany({
      where: {
        diagnosticoCIE10: { in: codigosInmediatos },
        creadoEn: { lt: hace24Horas },
        estado: 'PENDIENTE',
      },
      include: {
        paciente: { select: { nombres: true, apellidos: true } },
        historia: { 
          select: { 
            medico: { 
              select: { 
                nombres: true, 
                apellidos: true,
                establecimientoId: true 
              } 
            }
          } 
        }
      },
      orderBy: { creadoEn: 'asc' },
    });
  }

  async gestionarNotificacion(id: number, estado: string, usuarioId: number) {
    return this.prisma.notificacionEpidemiologica.update({
      where: { id },
      data: {
        estado,
        gestionadoEn: new Date(),
        gestionadoPorId: usuarioId,
      },
    });
  }
}
