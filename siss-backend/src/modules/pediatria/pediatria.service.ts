import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegistrarControlNiñoSanoDto } from './dto/registrar-control-nino-sano.dto';
import { RiesgoDesarrollo } from '@prisma/client';
import { DateUtils } from '../../common/utils/date-utils';

@Injectable()
export class PediatriaService {
  constructor(private prisma: PrismaService) {}

  async registrarControlNiñoSano(dto: RegistrarControlNiñoSanoDto, usuarioId: number) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: dto.pacienteId },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Validar edad (Niño Sano suele ser para menores de 5-12 años, pero permitimos hasta 18)
    const fechaNacimiento = new Date(paciente.fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getUTCFullYear() - fechaNacimiento.getUTCFullYear();
    const m = hoy.getUTCMonth() - fechaNacimiento.getUTCMonth();
    if (m < 0 || (m === 0 && hoy.getUTCDate() < fechaNacimiento.getUTCDate())) {
      edad--;
    }

    if (edad >= 18) {
      throw new BadRequestException('El control de niño sano solo aplica para pacientes menores de 18 años');
    }

    // 1. Crear automáticamente la nota SOAP en Historia Clínica
    // Regla de Oro: Usar Literal UTC para almacenamiento
    const fechaControl = dto.fechaControl 
      ? new Date(dto.fechaControl) 
      : DateUtils.getLiteralNow();
    const semanaEpidemiologica = DateUtils.getSemanaEpidemiologica(fechaControl);
    
    const historia = await this.prisma.historiaClinica.create({
      data: {
        pacienteId: dto.pacienteId,
        medicoId: usuarioId,
        fecha: fechaControl,
        semanaEpidemiologica,
        subjetivo: `Control de Niño Sano. Evaluación de crecimiento y desarrollo.`,
        objetivo: `Peso: ${dto.peso}kg, Talla: ${dto.talla}cm, PC: ${dto.perimetroCefalico || '--'}cm, IMC: ${dto.imc || '--'}. Nutrición: ${dto.lactanciaMaterna ? 'Lactancia Materna' : 'No reportada'}.`,
        analisis: `Crecimiento adecuado para la edad. Riesgo de desarrollo: ${dto.alertaDesarrollo}. Estado Nutricional: ${dto.estadoNutricional || 'Pendiente'}.`,
        plan: `Observaciones: ${dto.observaciones || 'Sin observaciones adicionales'}. Próximo control según esquema.`,

        diagnosticos: {
          create: {
            codigoCIE10: 'Z00.1', // Control de salud infantil de rutina
            descripcion: 'Control de salud de rutina del niño',
            tipo: 'PRINCIPAL'
          }
        },
        // Crear recetas si vienen en el DTO
        recetas: dto.recetas && dto.recetas.length > 0 ? {
          create: {
            pacienteId: dto.pacienteId,
            establecimientoId: paciente.establecimientoId || 1,
            detalles: {
              create: dto.recetas.map(r => ({
                medicamentoId: r.medicamentoId,
                dosis: r.dosis,
                frecuencia: r.frecuencia,
                duracion: String(r.duracion),
                cantidad: r.cantidad,
                indicaciones: r.indicaciones
              }))
            }
          }
        } : undefined,

        // Solicitudes de Laboratorio
        solicitudesLab: dto.laboratorios && dto.laboratorios.length > 0 ? {
          create: {
            pacienteId: dto.pacienteId,
            establecimientoId: paciente.establecimientoId || 1,
            detalles: {
              create: dto.laboratorios.map(l => ({
                examenId: Number(l.examenId),
                observaciones: l.indicaciones || ''
              }))
            }
          }
        } : undefined,

        // Solicitudes de Radiología
        solicitudesRad: dto.radiologias && dto.radiologias.length > 0 ? {
          create: {
            pacienteId: dto.pacienteId,
            establecimientoId: paciente.establecimientoId || 1,
            detalles: {
              create: dto.radiologias.map(r => ({
                estudioId: Number(r.estudioId),
                observaciones: r.indicaciones || ''
              }))
            }
          }
        } : undefined,

        // Referencias / Remisiones
        referidos: dto.referencias && dto.referencias.length > 0 ? {
          create: dto.referencias.map(ref => ({
            establecimientoOrigenId: paciente.establecimientoId || 1,
            establecimientoDestinoId: Number(ref.establecimientoDestinoId),
            especialidadDestino: ref.especialidadDestino || 'PEDIATRÍA',
            motivo: ref.motivo,
            urgente: ref.urgente || false,
            estado: 'EMITIDO'
          }))
        } : undefined,

        // Incapacidades
        incapacidades: dto.incapacidades && dto.incapacidades.length > 0 ? {
          create: dto.incapacidades.map(inc => ({
            fechaInicio: new Date(inc.fechaInicio),
            fechaFin: new Date(inc.fechaFin),
            dias: Number(inc.dias),
            tipo: inc.tipo || 'LABORAL',
            motivo: inc.motivo
          }))
        } : undefined,
        
        // Sincronizar signos vitales con la historia general
        peso: dto.peso,
        talla: dto.talla,
      }

    });


    // 2. Crear el registro específico de Pediatría
    const control = await this.prisma.controlNiñoSano.create({
      data: {
        pacienteId: dto.pacienteId,
        historiaId: historia.id,
        peso: dto.peso,
        talla: dto.talla,
        perimetroCefalico: dto.perimetroCefalico,
        imc: dto.imc,
        estadoNutricional: dto.estadoNutricional,
        desarrolloJson: dto.desarrolloJson,
        alertaDesarrollo: dto.alertaDesarrollo || RiesgoDesarrollo.NORMAL,
        vacunasRecetadasJson: dto.vacunasRecetadas && dto.vacunasRecetadas.length > 0 ? (dto.vacunasRecetadas as any) : undefined,
        lactanciaMaterna: dto.lactanciaMaterna ?? true,
        alimentacionComp: dto.alimentacionComp ?? false,
        vitaminaA: dto.vitaminaA ?? false,
        hierro: dto.hierro ?? false,
        desparasitacion: dto.desparasitacion ?? false,
        observaciones: dto.observaciones,
        creadoPorId: usuarioId, // Auditoría
        creadoEn: fechaControl // Forzamos Literal UTC también aquí
      },
      include: {
        historia: true
      }
    });

    return control;
  }



  async getHistorialCrecimiento(pacienteId: number) {
    return this.prisma.controlNiñoSano.findMany({
      where: { 
        pacienteId,
        activo: true // Solo activos
      },
      orderBy: { creadoEn: 'asc' },
      select: {
        creadoEn: true,
        peso: true,
        talla: true,
        perimetroCefalico: true,
        imc: true,
        estadoNutricional: true
      }
    });
  }

  async getControlesByPaciente(pacienteId: number) {
    const controles = await this.prisma.controlNiñoSano.findMany({
      where: { 
        pacienteId,
        activo: true // Solo activos
      },
      include: {
        historia: {
          include: {
            medico: {
              select: {
                nombres: true,
                apellidos: true
              }
            },
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
            proximaCita: true,
          }
        }
      },
      orderBy: { creadoEn: 'desc' }
    });

    // Enlazar las vacunas aplicadas en la misma fecha y hora del control
    const controlesConVacunas = await Promise.all(controles.map(async (c) => {
      const vacunas = await this.prisma.vacunacionRegistro.findMany({
        where: {
          pacienteId: c.pacienteId,
          fechaAplicacion: c.creadoEn
        },
        include: {
          vacuna: true,
          esquema: true,
          lote: true
        }
      });
      const controlConVacunas = c as any;
      controlConVacunas.vacunas = vacunas;
      controlConVacunas.vacunasRecetadas = c.vacunasRecetadasJson || [];
      return controlConVacunas;
    }));

    return controlesConVacunas;
  }


  async getRoadmapVacunacion(pacienteId: number) {
    // 1. Obtener el paciente para su fecha de nacimiento
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: { fechaNacimiento: true }
    });

    // 2. Obtener el esquema oficial completo
    const esquemaOficial = await this.prisma.catVacuna.findMany({
      where: { activo: true },
      include: {
        esquemas: {
          orderBy: { edadRecomendadaMeses: 'asc' }
        }
      }
    });

    // 3. Obtener lo que ya tiene aplicado el paciente con relaciones
    const aplicaciones = await this.prisma.vacunacionRegistro.findMany({
      where: { pacienteId },
      select: {
        vacunaId: true,
        esquemaId: true,
        fechaAplicacion: true,
        establecimiento: {
          select: { nombre: true }
        },
        aplicadoPor: {
          select: { nombres: true, apellidos: true }
        }
      }
    });

    // 4. Cruzar datos para ver qué falta y calcular tiempos
    const roadmap = esquemaOficial.map(vacuna => {
      return {
        vacunaId: vacuna.id,
        nombre: vacuna.nombre,
        dosis: vacuna.esquemas.map(esq => {
          const aplicacion = aplicaciones.find(a => a.esquemaId === esq.id);
          
          let edadMesesAlAplicar: number | null = null;
          let estadoTiempo: string | null = null; // 'A tiempo' | 'Fuera de tiempo'
          
          if (paciente && aplicacion && aplicacion.fechaAplicacion) {
            const birth = new Date(paciente.fechaNacimiento);
            const appDate = new Date(aplicacion.fechaAplicacion);
            
            const diffYears = appDate.getFullYear() - birth.getFullYear();
            const diffMonths = appDate.getMonth() - birth.getMonth();
            const diffDays = appDate.getDate() - birth.getDate();
            
            let months = (diffYears * 12) + diffMonths;
            if (diffDays < 0) {
              months -= 1;
            }
            edadMesesAlAplicar = Math.max(0, months);
            
            // Si la dosis se aplicó después de la edad recomendada + 1 mes, se considera fuera de tiempo
            if (edadMesesAlAplicar > esq.edadRecomendadaMeses + 1) {
              estadoTiempo = 'Fuera de tiempo';
            } else {
              estadoTiempo = 'A tiempo';
            }
          }

          return {
            esquemaId: esq.id,
            numeroDosis: esq.numeroDosis,
            edadRecomendadaMeses: esq.edadRecomendadaMeses,
            aplicada: !!aplicacion,
            fechaAplicacion: aplicacion?.fechaAplicacion || null,
            establecimientoNombre: aplicacion?.establecimiento?.nombre || null,
            aplicadorNombre: aplicacion?.aplicadoPor 
              ? `${aplicacion.aplicadoPor.nombres} ${aplicacion.aplicadoPor.apellidos}` 
              : null,
            edadMesesAlAplicar,
            estadoTiempo
          };
        })
      };
    });

    return roadmap;
  }

  async generarPdfCarnet(pacienteId: number) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: pacienteId },
      include: {
        establecimiento: true,
        departamento: true,
        municipio: true,
        sexo: true
      }
    });

    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    const controles = await this.getControlesByPaciente(pacienteId);
    const roadmap = await this.getRoadmapVacunacion(pacienteId);

    // Llamar al servicio de PDF (que inyectaremos o usaremos)
    // Para simplificar esta demo, asumimos que PdfService tendrá el método
    return { paciente, controles, roadmap };
  }

  async generarPdfControlIndividual(controlId: number) {
    const control = await this.prisma.controlNiñoSano.findUnique({
      where: { id: controlId },
      include: {
        creadoPor: true,
        historia: {
          include: {
            medico: true,
            diagnosticos: true,
            proximaCita: true,
            recetas: {
              include: {
                detalles: {
                  include: {
                    medicamento: true
                  }
                }
              }
            },
            solicitudesLab: {
              include: {
                detalles: {
                  include: {
                    examen: true
                  }
                }
              }
            },
            solicitudesRad: {
              include: {
                detalles: {
                  include: {
                    estudio: true
                  }
                }
              }
            },
            referidos: {
              include: {
                destino: true
              }
            },
            incapacidades: true
          }
        }
      }
    });

    if (!control) throw new NotFoundException('Control no encontrado');

    const paciente = await this.prisma.paciente.findUnique({
      where: { id: control.pacienteId },
      include: {
        establecimiento: true,
        departamento: true,
        municipio: true,
        sexo: true
      }
    });

    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    return { paciente, control };
  }

  async eliminarControl(id: number, usuarioId: number) {
    // 1. Obtener el control para conocer su historiaId
    const control = await this.prisma.controlNiñoSano.findUnique({
      where: { id }
    });

    if (!control) throw new NotFoundException('Control no encontrado');

    // 2. Ejecutar anulación en cascada (Eliminación Lógica)
    return this.prisma.$transaction(async (tx) => {
      // Anular el control pediátrico
      const controlAnulado = await tx.controlNiñoSano.update({
        where: { id },
        data: {
          activo: false,
          eliminadoEn: DateUtils.getLiteralNow(),
          eliminadoPorId: usuarioId
        }
      });

      // 2. Anular la nota de Historia Clínica asociada
      await tx.historiaClinica.update({
        where: { id: control.historiaId },
        data: {
          eliminadoEn: DateUtils.getLiteralNow(),
          eliminadoPorId: usuarioId
        }
      });

      // 3. Anular Recetas vinculadas
      await tx.receta.updateMany({
        where: { historiaId: control.historiaId },
        data: {
          estado: 'CANCELADA'
        }
      });

      // 4. Anular Solicitudes de Laboratorio
      await tx.solicitudLaboratorio.updateMany({
        where: { historiaId: control.historiaId },
        data: {
          estado: 'CANCELADO'
        }
      });

      // 5. Anular Solicitudes de Radiología
      await tx.solicitudRadiologia.updateMany({
        where: { historiaId: control.historiaId },
        data: {
          estado: 'CANCELADO'
        }
      });

      // 6. Anular Referencias (Referidos)
      await tx.referido.deleteMany({
        where: { historiaId: control.historiaId }
      });

      return controlAnulado;
    });
  }



}



