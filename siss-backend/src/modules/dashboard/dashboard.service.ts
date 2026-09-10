import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private getFiltroCitasMedico(user: any) {
    if (user.rol !== 'MEDICO') return {};

    const filtro: any = {
      medicoId: user.id,
      establecimientoId: user.establecimientoId,
    };

    if (user.asignacionId) {
      const historicasCompatibles = user.especialidadId
        ? {
            asignacionId: null,
            especialidadId: user.especialidadId,
          }
        : user.servicioId
          ? {
              asignacionId: null,
              servicioId: user.servicioId,
            }
          : {
              asignacionId: null,
              servicioId: null,
              especialidadId: null,
            };

      filtro.OR = [
        { asignacionId: user.asignacionId },
        historicasCompatibles,
      ];
    }

    return filtro;
  }

  async getStats(user: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = {
      citasHoy: 0,
      pacientesEsperando: 0,
      historiasPendientes: 0,
      alertasInventario: 0,
      casosEpi: 0,
    };

    // Filtros comunes
    const whereEstablecimiento = user.rol === 'ADMIN' ? {} : { establecimientoId: user.establecimientoId };
    const whereCitasMedico = this.getFiltroCitasMedico(user);

    // 1. Citas de Hoy
    stats.citasHoy = await this.prisma.cita.count({
      where: {
        ...whereEstablecimiento,
        ...whereCitasMedico,
        fechaHora: { gte: today, lt: tomorrow },
        estado: { not: 'CANCELADA' },
      },
    });

    // 2. Pacientes en espera (Triaje o Sala)
    stats.pacientesEsperando = await this.prisma.cita.count({
      where: {
        ...whereEstablecimiento,
        ...whereCitasMedico,
        estado: 'EN_SALA',
        fechaHora: { gte: today, lt: tomorrow },
      },
    });

    // 3. Historias Pendientes (Citas de hoy que no tienen historia clínica asociada)
    // Esto es un poco más complejo con Prisma, pero aproximamos
    if (user.rol === 'MEDICO') {
      stats.historiasPendientes = await this.prisma.cita.count({
        where: {
          ...whereCitasMedico,
          fechaHora: { gte: today, lt: tomorrow },
          estado: { in: ['PROGRAMADA', 'CONFIRMADA', 'EN_SALA'] },
          historia: { is: null },
        },
      });
    }

    // 4. Alertas de Inventario (Bajo stock)
    stats.alertasInventario = await this.prisma.inventario.count({
      where: {
        ...whereEstablecimiento,
        cantidadActual: { lte: this.prisma.inventario.fields.cantidadMinima as any },
        activo: true,
      },
    });

    // 5. Casos Epi Pendientes
    stats.casosEpi = await this.prisma.notificacionEpidemiologica.count({
      where: {
        estado: 'PENDIENTE',
      },
    });

    return stats;
  }

  async getAgendaHoy(user: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.cita.findMany({
      where: {
        ...this.getFiltroCitasMedico(user),
        fechaHora: { gte: today, lt: tomorrow },
        estado: { not: 'CANCELADA' },
      },
      include: {
        paciente: {
          select: { id: true, nombres: true, apellidos: true, numeroExpediente: true },
        },
      },
      orderBy: { fechaHora: 'asc' },
    });
  }
}
