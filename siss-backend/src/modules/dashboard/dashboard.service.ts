import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

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

    // 1. Citas de Hoy
    stats.citasHoy = await this.prisma.cita.count({
      where: {
        ...whereEstablecimiento,
        fechaHora: { gte: today, lt: tomorrow },
        medicoId: user.rol === 'MEDICO' ? user.id : undefined,
        estado: { not: 'CANCELADA' },
      },
    });

    // 2. Pacientes en espera (Triaje o Sala)
    stats.pacientesEsperando = await this.prisma.cita.count({
      where: {
        ...whereEstablecimiento,
        estado: 'EN_SALA',
        fechaHora: { gte: today, lt: tomorrow },
      },
    });

    // 3. Historias Pendientes (Citas de hoy que no tienen historia clínica asociada)
    // Esto es un poco más complejo con Prisma, pero aproximamos
    if (user.rol === 'MEDICO') {
      stats.historiasPendientes = await this.prisma.cita.count({
        where: {
          medicoId: user.id,
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

  async getAgendaHoy(medicoId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.cita.findMany({
      where: {
        medicoId,
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
