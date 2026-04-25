import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EstadoCita } from '@prisma/client';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async getDashboardKPIs(
    establecimientoId?: number,
    inicio?: Date,
    fin?: Date,
  ) {
    const now = new Date();

    // Si no se proveen fechas, usamos el "hoy" local (GMT-6)
    let startRange = inicio;
    let endRange = fin;

    console.log(
      `[KPIs Service] Range applied: ${startRange?.toISOString()} to ${endRange?.toISOString()}`,
    );

    if (!startRange || !endRange) {
      const currentUtcHour = now.getUTCHours();
      startRange = new Date(now);
      if (currentUtcHour < 6) {
        startRange.setUTCDate(now.getUTCDate() - 1);
      }
      startRange.setUTCHours(6, 0, 0, 0);

      endRange = new Date(startRange);
      endRange.setUTCDate(startRange.getUTCDate() + 1);
    } else {
      // Si vienen fechas de la UI (YYYY-MM-DD), asegurar que el fin cubra todo el día en UTC
      endRange.setUTCHours(23, 59, 59, 999);
    }

    const startOfMonth = new Date(
      startRange.getFullYear(),
      startRange.getMonth(),
      1,
    );
    const baseFilter = establecimientoId ? { establecimientoId } : {};

    const [consultas, pacientesNuevos, stockCritico, citasPendientes] =
      await Promise.all([
        // 1. Consultas en el rango
        this.prisma.historiaClinica.count({
          where: {
            fecha: { gte: startRange, lte: endRange },
            ...baseFilter,
          },
        }),

        // 2. Pacientes Nuevos (Mes del inicio del rango)
        this.prisma.paciente.count({
          where: {
            fechaRegistro: { gte: startOfMonth, lte: endRange },
          },
        }),

        // 3. Stock Crítico (Siempre actual)
        this.prisma.inventario.count({
          where: {
            ...baseFilter,
            activo: true,
            cantidadActual: { lt: 20 },
          },
        }),

        // 4. Citas Pendientes (Próximas 24h desde hoy o en el rango)
        this.prisma.cita.count({
          where: {
            ...baseFilter,
            fechaHora: { gte: startRange, lte: endRange },
            estado: { in: [EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA] },
          },
        }),
      ]);

    return {
      consultasHoy: consultas, // Renombramos internamente si es necesario pero mantenemos la interfaz
      pacientesNuevos,
      stockCritico,
      citasPendientes,
      fechaActualizacion: now,
    };
  }

  async getProductividadData(inicio: Date, fin: Date, estId?: number) {
    const where: any = {
      fecha: { gte: inicio, lte: fin },
    };
    if (estId) where.establecimientoId = estId;

    const historias = await this.prisma.historiaClinica.findMany({
      where,
      include: {
        medico: {
          select: {
            nombres: true,
            apellidos: true,
            especialidad: { select: { nombre: true } },
            establecimiento: { select: { nombre: true } },
          },
        },
      },
    });

    const agrupado = new Map();
    historias.forEach((h) => {
      const key = `${h.medicoId}`;
      if (!agrupado.has(key)) {
        agrupado.set(key, {
          medico: `${h.medico.nombres} ${h.medico.apellidos}`,
          especialidad: h.medico.especialidad?.nombre || 'General',
          establecimiento: h.medico.establecimiento?.nombre || 'N/A',
          total: 0,
        });
      }
      agrupado.get(key).total++;
    });

    return Array.from(agrupado.values());
  }

  async getInventarioCriticoData(estId?: number) {
    const where: any = {
      activo: true,
      cantidadActual: { lt: 20 },
    };
    if (estId) where.establecimientoId = estId;

    const items = await this.prisma.inventario.findMany({
      where,
      include: {
        medicamento: { select: { nombreGenerico: true, codigo: true } },
      },
      orderBy: { cantidadActual: 'asc' },
    });

    return items.map((i) => ({
      nombre: i.medicamento.nombreGenerico,
      codigo: i.medicamento.codigo,
      lote: i.lote || 'N/A',
      vencimiento: i.fechaVencimiento?.toISOString().split('T')[0] || 'N/A',
      stock: i.cantidadActual,
    }));
  }

  async getDemografiaData(estId?: number) {
    const where: any = { activo: true };
    if (estId) where.establecimientoId = estId;

    const pacientes = await this.prisma.paciente.findMany({
      where,
      include: {
        sexo: { select: { nombre: true } },
        departamento: { select: { nombre: true } },
        municipio: { select: { nombre: true } },
        establecimiento: { select: { nombre: true } },
      },
    });

    return pacientes.map((p) => {
      const edad = this.calcularEdad(p.fechaNacimiento);
      return {
        expediente: p.numeroExpediente,
        nombreCompleto: `${p.nombres} ${p.apellidos}`,
        sexo: p.sexo.nombre,
        edad,
        departamento: p.departamento.nombre,
        municipio: p.municipio.nombre,
        comunidad: p.comunidad || 'N/A',
        direccion: p.direccion || 'N/A',
        telefono: p.telefono || 'N/A',
        telefonoEmergencia: p.telefonoEmergencia || 'N/A',
        correo: p.correo || 'N/A',
        establecimiento: p.establecimiento.nombre,
        fechaRegistro: p.fechaRegistro.toISOString().split('T')[0],
      };
    });
  }

  private calcularEdad(fechaNacimiento: Date): number {
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  async getKardexData(inicio: Date, fin: Date, estId?: number) {
    const where: any = {
      fecha: { gte: inicio, lte: fin },
    };
    if (estId) {
      where.inventario = { establecimientoId: estId };
    }

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where,
      include: {
        inventario: {
          include: {
            medicamento: { select: { nombreGenerico: true, codigo: true } },
            establecimiento: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    return movimientos.map((m) => ({
      fecha: m.fecha.toISOString().split('T')[0],
      hora: m.fecha.toISOString().split('T')[1].split('.')[0],
      medicamento: m.inventario.medicamento.nombreGenerico,
      codigo: m.inventario.medicamento.codigo,
      lote: m.inventario.lote || 'N/A',
      tipo: m.tipo,
      cantidad: m.cantidad,
      motivo: m.motivo || 'N/A',
      establecimiento: m.inventario.establecimiento.nombre,
    }));
  }

  async getMorbilidadData(inicio: Date, fin: Date, estId?: number) {
    const where: any = {
      historia: {
        fecha: { gte: inicio, lte: fin },
      },
    };

    if (estId) {
      where.historia = {
        ...where.historia,
        cita: { establecimientoId: estId },
      };
    }

    const diagnosticos = await this.prisma.diagnostico.findMany({
      where,
      select: {
        codigoCIE10: true,
        descripcion: true,
        tipo: true,
      },
    });

    const agrupado = new Map<string, any>();
    diagnosticos.forEach((d) => {
      const key = d.codigoCIE10;
      if (!agrupado.has(key)) {
        agrupado.set(key, {
          codigo: d.codigoCIE10,
          descripcion: d.descripcion,
          principal: 0,
          secundario: 0,
          total: 0,
        });
      }
      const item = agrupado.get(key);
      if (d.tipo === 'PRINCIPAL') item.principal++;
      else if (d.tipo === 'SECUNDARIO') item.secundario++;
      item.total++;
    });

    return Array.from(agrupado.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }

  async getCitasData(inicio: Date, fin: Date, estId?: number) {
    if (!inicio || isNaN(inicio.getTime())) inicio = new Date();
    if (!fin || isNaN(fin.getTime())) fin = new Date();

    const where: any = {
      fechaHora: { gte: inicio, lte: fin },
    };

    if (estId && !isNaN(estId)) {
      where.establecimientoId = estId;
    }

    const citas = await this.prisma.cita.findMany({
      where,
      include: {
        paciente: {
          select: { nombres: true, apellidos: true, numeroExpediente: true },
        },
        medico: { select: { nombres: true, apellidos: true } },
        especialidad: { select: { nombre: true } },
        establecimiento: { select: { nombre: true } },
      },
      orderBy: { fechaHora: 'asc' },
    });

    console.log(
      `[ReportesService] Citas found: ${citas.length} for range ${inicio.toISOString()} - ${fin.toISOString()}`,
    );

    return citas
      .map((c) => {
        try {
          return {
            fecha: c.fechaHora
              ? c.fechaHora.toISOString().split('T')[0]
              : 'N/A',
            hora: c.fechaHora
              ? c.fechaHora.toISOString().split('T')[1].split('.')[0]
              : 'N/A',
            paciente: c.paciente
              ? `${c.paciente.nombres} ${c.paciente.apellidos}`
              : 'N/A',
            expediente: c.paciente?.numeroExpediente || 'N/A',
            medico: c.medico
              ? `${c.medico.nombres} ${c.medico.apellidos}`
              : 'N/A',
            especialidad: c.especialidad?.nombre || 'N/A',
            estado: c.estado || 'N/A',
            tipo: c.tipo || 'N/A',
            establecimiento: c.establecimiento?.nombre || 'N/A',
          };
        } catch (e) {
          console.error('Error mapping cita:', c.id, e);
          return null;
        }
      })
      .filter((c) => c !== null);
  }

  async getReportesDisponibles() {
    return await (this.prisma as any).reporteDisponible.findMany({
      orderBy: { categoria: 'asc' },
    });
  }

  async crearReporte(data: any) {
    return await (this.prisma as any).reporteDisponible.create({ data });
  }

  async actualizarReporte(id: number, data: any) {
    return await (this.prisma as any).reporteDisponible.update({
      where: { id },
      data,
    });
  }

  async eliminarReporte(id: number) {
    return await (this.prisma as any).reporteDisponible.delete({
      where: { id },
    });
  }

  // =============================================
  // REPORTES DE VACUNACIÓN (PAI)
  // =============================================

  async getConsolidadoPaiData(inicio: Date, fin: Date, estId?: number) {
    const where: any = {
      fechaAplicacion: { gte: inicio, lte: fin }
    };
    if (estId) where.establecimientoId = estId;

    const registros = await this.prisma.vacunacionRegistro.findMany({
      where,
      include: {
        vacuna: { select: { nombre: true } },
        paciente: { select: { nombres: true, apellidos: true, dni: true, fechaNacimiento: true } },
        establecimiento: { select: { nombre: true } },
        lote: { select: { codigoLote: true } }
      },
      orderBy: { fechaAplicacion: 'asc' }
    });

    return registros.map(r => ({
      fecha: r.fechaAplicacion.toISOString().split('T')[0],
      paciente: `${r.paciente.nombres} ${r.paciente.apellidos}`,
      dni: r.paciente.dni,
      edad: this.calcularEdad(r.paciente.fechaNacimiento),
      vacuna: r.vacuna.nombre,
      lote: r.lote.codigoLote,
      sitio: r.sitioAplicacion || '—',
      via: r.viaAplicacion || '—',
      establecimiento: r.establecimiento.nombre
    }));
  }

  async getInventarioVacunasData(estId?: number) {
    const where: any = { activo: true };
    if (estId) where.establecimientoId = estId;

    const lotes = await this.prisma.loteVacuna.findMany({
      where,
      include: {
        vacuna: { select: { nombre: true } },
        establecimiento: { select: { nombre: true } }
      },
      orderBy: { fechaVencimiento: 'asc' }
    });

    return lotes.map(l => ({
      vacuna: l.vacuna.nombre,
      lote: l.codigoLote,
      fabricante: l.fabricante || '—',
      vencimiento: l.fechaVencimiento.toISOString().split('T')[0],
      inicial: l.cantidadInicial,
      actual: l.cantidadActual,
      establecimiento: l.establecimiento.nombre
    }));
  }

  async getCoberturaData(inicio: Date, fin: Date, estId?: number) {
    const where: any = {
      fechaAplicacion: { gte: inicio, lte: fin }
    };
    if (estId) where.establecimientoId = estId;

    // Obtener todas las vacunas activas
    const vacunas = await this.prisma.catVacuna.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, poblacionMeta: true }
    });

    // Contar aplicaciones por vacuna
    const aplicaciones = await this.prisma.vacunacionRegistro.groupBy({
      by: ['vacunaId'],
      where,
      _count: { id: true }
    });

    const stats = vacunas.map(v => {
      const app = aplicaciones.find(a => a.vacunaId === v.id);
      const total = app ? app._count.id : 0;
      // Simulamos una meta basada en el establecimiento o un valor fijo para el reporte
      const meta = 100; // Valor base de ejemplo
      return {
        vacuna: v.nombre,
        poblacionMeta: v.poblacionMeta || 'Población General',
        aplicadas: total,
        meta: meta,
        porcentaje: Math.min((total / meta) * 100, 100)
      };
    });

    return stats;
  }
}
