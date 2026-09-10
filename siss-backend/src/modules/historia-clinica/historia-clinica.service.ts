import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHistoriaClinicaDto } from './dto/create-historia-clinica.dto';
import { DateUtils } from '../../common/utils/date-utils';

@Injectable()
export class HistoriaClinicaService {
  constructor(private prisma: PrismaService) {}

  async crear(
    dto: CreateHistoriaClinicaDto,
    medicoId: number,
    establecimientoId: number,
  ) {
    const {
      pacienteId,
      diagnosticos,
      recetas,
      laboratorio,
      radiologia,
      incapacidades,
      referencias,
      notificacionEpidemiologica,
      respuestaFormulario,
      ...datos
    } = dto;

    // Verificar paciente
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: pacienteId },
    });
    if (!paciente)
      throw new NotFoundException(`Paciente ${pacienteId} no encontrado`);

    return this.prisma
      .$transaction(async (tx) => {
        const { proximaCita, ...rest } = datos;
        const fechaFinal = dto.fecha ? new Date(dto.fecha) : DateUtils.getLiteralNow();
        const semanaEpidemiologica = DateUtils.getSemanaEpidemiologica(fechaFinal);

        const historia = await tx.historiaClinica.create({
          data: {
            ...rest,
            fecha: fechaFinal,
            semanaEpidemiologica,
            pacienteId,
            medicoId,
            diagnosticos: {
              create: diagnosticos || [],
            },
          },
          include: {
            diagnosticos: true,
            medico: { select: { nombres: true, apellidos: true } },
          },
        });

        // Crear próxima cita si se proporcionó y vincularla
        if (proximaCita) {
          // Obtener establecimiento del médico de la cita (o del médico actual)
          const medCita = await tx.usuario.findUnique({
            where: { id: proximaCita.medicoId },
          });

          const nuevaCita = await tx.cita.create({
            data: {
              pacienteId,
              medicoId: proximaCita.medicoId,
              especialidadId: proximaCita.especialidadId,
              fechaHora: new Date(proximaCita.fechaHora),
              tipo: proximaCita.tipo,
              motivo: proximaCita.motivo,
              duracionMinutos: proximaCita.duracionMinutos || 20,
              establecimientoId: medCita?.establecimientoId || 1, // Fallback
              creadoPorId: medicoId,
            },
          });

          // Vincular a la historia
          await tx.historiaClinica.update({
            where: { id: historia.id },
            data: { proximaCitaId: nuevaCita.id },
          });
        }

        // Si hay recetas, crearlas
        if (recetas && recetas.length > 0) {
          await tx.receta.create({
            data: {
              historiaId: historia.id,
              pacienteId,
              establecimientoId:
                establecimientoId || paciente.establecimientoId,
              detalles: {
                create: recetas.map((r) => ({
                  medicamentoId: r.medicamentoId,
                  dosis: r.dosis,
                  frecuencia: r.frecuencia,
                  duracion: String(r.duracion),
                  cantidad: r.cantidad,
                  indicaciones: r.indicaciones,
                })),
              },
            },
          });
        }

        // Si hay solicitudes de laboratorio, crearlas
        if (laboratorio && laboratorio.length > 0) {
          await tx.solicitudLaboratorio.create({
            data: {
              historiaId: historia.id,
              pacienteId,
              establecimientoId: paciente.establecimientoId,
              detalles: {
                create: laboratorio.map((examenId) => ({
                  examenId,
                })),
              },
            },
          });
        }

        // Si hay solicitudes de radiología, crearlas
        if (radiologia && radiologia.length > 0) {
          await tx.solicitudRadiologia.create({
            data: {
              historiaId: historia.id,
              pacienteId,
              establecimientoId: paciente.establecimientoId,
              detalles: {
                create: radiologia.map((estudioId) => ({
                  estudioId,
                })),
              },
            },
          });
        }

        // Si hay incapacidades, crearlas
        if (incapacidades && incapacidades.length > 0) {
          await tx.incapacidad.createMany({
            data: incapacidades.map((inc) => ({
              historiaId: historia.id,
              fechaInicio: new Date(inc.fechaInicio),
              fechaFin: new Date(inc.fechaFin),
              dias: inc.dias,
              tipo: inc.tipo,
              motivo: inc.motivo,
            })),
          });
        }

        // Si hay referencias, crearlas
        if (dto.referencias && dto.referencias.length > 0) {
          await tx.referido.createMany({
            data: dto.referencias.map((ref) => ({
              historiaId: historia.id,
              establecimientoOrigenId: establecimientoId,
              establecimientoDestinoId: ref.establecimientoDestinoId,
              especialidadDestino: ref.especialidadDestino,
              motivo: ref.motivo,
              urgente: ref.urgente || false,
              estado: 'EMITIDO',
            })),
          });
        }

        // Si hay respuesta de formulario dinámico, crearla
        if (respuestaFormulario && datos.plantillaId) {
          await tx.respuestaFormulario.create({
            data: {
              historiaId: historia.id,
              plantillaId: datos.plantillaId,
              respuestas: respuestaFormulario,
              completado: true,
            },
          });
        }

        // Si hay notificación epidemiológica, crearla
        if (dto.notificacionEpidemiologica) {
          const { fechaInicioSintomas, ...notifData } = dto.notificacionEpidemiologica;
          await tx.notificacionEpidemiologica.create({
            data: {
              ...notifData,
              historiaId: historia.id,
              pacienteId,
              creadoPorId: medicoId,
              fechaInicioSintomas: fechaInicioSintomas
                ? new Date(fechaInicioSintomas)
                : undefined,
            },
          });
        }

        // Marcar cita como ATENDIDA si existe
        if (datos.citaId) {
          await tx.cita.update({
            where: { id: datos.citaId },
            data: { estado: 'ATENDIDA' },
          });
        }

        return historia;
      })
      .catch((err) => {
        console.error('--- ERROR DETALLADO DE PRISMA ---');
        console.error('Code:', err.code);
        console.error('Meta:', err.meta);
        console.error('Message:', err.message);
        console.error('Full Error:', JSON.stringify(err, null, 2));
        throw err;
      });
  }

  async listarPorPaciente(pacienteId: number) {
    return this.prisma.historiaClinica.findMany({
      where: { pacienteId },
      orderBy: { fecha: 'desc' },
      include: {
        medico: {
          select: {
            nombres: true,
            apellidos: true,
            establecimiento: { select: { nombre: true } },
          },
        },
        diagnosticos: true,
        controlPrenatal: {
          select: {
            id: true,
            embarazoId: true,
            semanasGestacion: true
          }
        },
        respuestaFormulario: {
          include: {
            plantilla: {
              include: {
                secciones: {
                  include: { campos: true }
                }
              }
            }
          }
        }
      },
    });
  }

  async obtenerDetalle(id: number) {
    const nota = await this.prisma.historiaClinica.findUnique({
      where: { id },
      include: {
        paciente: true,
        medico: {
          select: {
            nombres: true,
            apellidos: true,
            numeroColegiado: true,
            establecimiento: { select: { nombre: true } },
          },
        },
        diagnosticos: true,
        recetas: {
          include: {
            detalles: { include: { medicamento: true } },
          },
        },
        solicitudesLab: {
          include: {
            detalles: { include: { examen: true } },
          },
        },
        solicitudesRad: {
          include: {
            detalles: { include: { estudio: true } },
          },
        },
        incapacidades: true,
        referidos: {
          include: {
            destino: { select: { nombre: true } },
          },
        },
        respuestaFormulario: {
          include: {
            plantilla: {
              include: {
                secciones: {
                  include: { campos: { orderBy: { orden: 'asc' } } },
                  orderBy: { orden: 'asc' },
                },
              },
            },
          },
        },
        proximaCita: true,
      },
    });
    if (!nota) throw new NotFoundException(`Nota clínica ${id} no encontrada`);
    return nota;
  }

  async obtenerHistorialUnificado(pacienteId: number) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: pacienteId },
      include: {
        sexo: true,
        tipoSangre: true,
        departamento: true,
        municipio: true,
        establecimiento: true,
        alergias: true,
      },
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${pacienteId} no encontrado`);
    }

    const [
      historias,
      triajes,
      controlesPediatricos,
      controlesPrenatales,
      hospitalizaciones,
      vacunaciones,
      recetas
    ] = await Promise.all([
      // 1. Consultas Médicas Generales y Especializadas
      this.prisma.historiaClinica.findMany({
        where: { pacienteId },
        orderBy: { fecha: 'desc' },
        include: {
          medico: {
            select: {
              nombres: true,
              apellidos: true,
              especialidad: { select: { nombre: true } },
              establecimiento: { select: { nombre: true } },
            },
          },
          diagnosticos: true,
          recetas: { include: { detalles: { include: { medicamento: true } } } },
          incapacidades: true,
        },
      }),

      // 2. Triajes
      this.prisma.triaje.findMany({
        where: { pacienteId },
        orderBy: { creadoEn: 'desc' },
        include: {
          enfermera: { select: { nombres: true, apellidos: true } },
        },
      }),

      // 3. Controles Pediátricos (CRED)
      this.prisma.controlNiñoSano.findMany({
        where: { pacienteId },
        orderBy: { creadoEn: 'desc' },
        include: {
          creadoPor: { select: { nombres: true, apellidos: true } },
        },
      }),

      // 4. Controles Prenatales
      this.prisma.controlPrenatal.findMany({
        where: { embarazo: { pacienteId } },
        orderBy: { fechaControl: 'desc' },
        include: {
          creadoPor: { select: { nombres: true, apellidos: true } },
          embarazo: true,
        },
      }),

      // 5. Hospitalizaciones
      this.prisma.ingresoHospitalario.findMany({
        where: { pacienteId },
        orderBy: { fechaIngreso: 'desc' },
        include: {
          medicoIngreso: { select: { nombres: true, apellidos: true } },
          cama: { include: { habitacion: { include: { sala: true } } } },
          notasEvolucion: { orderBy: { fecha: 'desc' } },
        },
      }),

      // 6. Vacunaciones (PAI)
      this.prisma.vacunacionRegistro.findMany({
        where: { pacienteId },
        orderBy: { fechaAplicacion: 'desc' },
        include: {
          vacuna: true,
          esquema: true,
          lote: true,
          establecimiento: { select: { nombre: true } },
          aplicadoPor: { select: { nombres: true, apellidos: true } },
        },
      }),

      // 7. Recetas
      this.prisma.receta.findMany({
        where: { pacienteId },
        orderBy: { creadaEn: 'desc' },
        include: {
          historia: { select: { medico: { select: { nombres: true, apellidos: true } } } },
          establecimiento: { select: { nombre: true } },
          detalles: { include: { medicamento: true } },
        },
      }),
    ]);

    return {
      paciente,
      historias,
      triajes,
      controlesPediatricos,
      controlesPrenatales,
      hospitalizaciones,
      vacunaciones,
      recetas,
    };
  }
}
