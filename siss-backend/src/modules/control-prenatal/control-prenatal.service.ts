import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CaptacionEmbarazoDto } from './dto/captacion-embarazo.dto';
import { RegistrarControlDto } from './dto/registrar-control.dto';
import { FinalizarEmbarazoDto } from './dto/finalizar-embarazo.dto';
import { EstadoEmbarazo, RiesgoObstetrico } from '@prisma/client';

@Injectable()
export class ControlPrenatalService {
  constructor(private prisma: PrismaService) {}

  async captarEmbarazo(dto: CaptacionEmbarazoDto, usuarioId: number) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: dto.pacienteId },
      include: { sexo: true }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    if (paciente.sexo.nombre.toLowerCase() !== 'femenino') {
      throw new BadRequestException('Solo se puede registrar embarazo en pacientes de sexo femenino');
    }

    // Verificar si ya tiene un embarazo activo
    const embarazoActivo = await this.prisma.embarazo.findFirst({
      where: {
        pacienteId: dto.pacienteId,
        estado: EstadoEmbarazo.ACTIVO
      }
    });

    if (embarazoActivo) {
      throw new BadRequestException('La paciente ya tiene un embarazo activo registrado');
    }

    let fpp: Date | null = null;
    if (dto.fum) {
      // Regla de Oro: Forzar Literal UTC para la FUM
      const fechaFum = new Date(dto.fum + 'T00:00:00Z');
      
      // Regla de Naegele: FUM + 7 días - 3 meses + 1 año
      const fechaFpp = new Date(fechaFum);
      fechaFpp.setUTCDate(fechaFpp.getUTCDate() + 7);
      fechaFpp.setUTCMonth(fechaFpp.getUTCMonth() - 3);
      fechaFpp.setUTCFullYear(fechaFpp.getUTCFullYear() + 1);
      fpp = fechaFpp;
    }

    // Regla de Oro: Usar lo que mande el cliente, o compensar servidor si no viene
    const literalFinal = dto.fechaLiteral ? new Date(dto.fechaLiteral) : new Date(Date.now() - (new Date().getTimezoneOffset() * 60000));

    const embarazo = await this.prisma.embarazo.create({
      data: {
        pacienteId: dto.pacienteId,
        fum: dto.fum ? new Date(dto.fum + 'T00:00:00Z') : null,
        fpp: fpp,
        fechaCaptacion: literalFinal,
        observaciones: dto.observaciones,
        creadoPorId: usuarioId,
        antecedentes: {
          create: {
            gravidez: dto.gravidez,
            partos: dto.partos,
            abortos: dto.abortos,
            cesareas: dto.cesareas,
            obitos: dto.obitos,
            ultimoEmbarazoPrevio: dto.ultimoEmbarazoPrevio,
            complicacionesPrevias: dto.complicacionesPrevias,
            creadoPorId: usuarioId
          }
        }
      },
      include: {
        antecedentes: true,
        paciente: true
      }
    });

    // Evaluar riesgo inicial
    const riesgo = this.evaluarRiesgoInicial(embarazo, paciente);
    if (riesgo === RiesgoObstetrico.ALTO) {
      await this.prisma.embarazo.update({
        where: { id: embarazo.id },
        data: { riesgo: RiesgoObstetrico.ALTO }
      });
      embarazo.riesgo = RiesgoObstetrico.ALTO;
    }

    // --- INTEGRACIÓN CON HISTORIA CLÍNICA ---
    // 1. Crear Nota SOAP de Captación
    const historia = await this.prisma.historiaClinica.create({
      data: {
        pacienteId: dto.pacienteId,
        medicoId: usuarioId,
        fecha: literalFinal,
        subjetivo: `Captación Prenatal. Paciente G:${dto.gravidez} P:${dto.partos} C:${dto.cesareas} A:${dto.abortos} O:${dto.obitos}.`,
        objetivo: `Embarazo de ${riesgo} riesgo. FUM: ${dto.fum || 'No provista'}.`,
        analisis: `Se inicia control prenatal. Riesgo detectado: ${riesgo}.`,
        plan: `Control prenatal periódico, exámenes de laboratorio de primer trimestre y suplementación.`,
        diagnosticos: {
          create: {
            codigoCIE10: riesgo === RiesgoObstetrico.ALTO ? 'Z35.9' : 'Z34.9',
            descripcion: riesgo === RiesgoObstetrico.ALTO ? 'Supervisión de embarazo de alto riesgo' : 'Supervisión de embarazo normal',
            tipo: 'PRINCIPAL'
          }
        }
      }
    });

    // 2. Crear el Control #1 vinculado
    let semanas = 0;
    if (embarazo.fum) {
      const hoy = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000));
      const difMs = hoy.getTime() - embarazo.fum.getTime();
      semanas = difMs / (1000 * 60 * 60 * 24 * 7);
    }

    await this.prisma.controlPrenatal.create({
      data: {
        embarazoId: embarazo.id,
        historiaClinicaId: historia.id,
        fechaControl: literalFinal,
        semanasGestacion: semanas,
        peso: 0, // Se llenará en la ficha detallada
        taSistolica: 0,
        taDiastolica: 0,
        observaciones: 'Captación Inicial',
        creadoPorId: usuarioId
      }
    });

    return embarazo;
  }

  private evaluarRiesgoInicial(embarazo: any, paciente: any): RiesgoObstetrico {
    // 1. Regla de Edad (HCPB - Regla de Oro)
    const fechaNac = new Date(paciente.fechaNacimiento); // Ya viene como Date de Prisma (UTC)
    const hoy = new Date();
    let edad = hoy.getUTCFullYear() - fechaNac.getUTCFullYear();
    const m = hoy.getUTCMonth() - fechaNac.getUTCMonth();
    if (m < 0 || (m === 0 && hoy.getUTCDate() < fechaNac.getUTCDate())) {
      edad--;
    }

    if (edad < 18 || edad > 35) return RiesgoObstetrico.ALTO;

    // 2. Regla de Antecedentes (HCPB)
    const ant = embarazo.antecedentes;
    if (ant.abortos >= 2) return RiesgoObstetrico.ALTO;
    if (ant.cesareas >= 2) return RiesgoObstetrico.ALTO;
    if (ant.obitos > 0) return RiesgoObstetrico.ALTO;
    
    if (ant.complicacionesPrevias && ant.complicacionesPrevias.toLowerCase().includes('preeclampsia')) {
      return RiesgoObstetrico.ALTO;
    }

    return RiesgoObstetrico.BAJO;
  }

  async registrarControl(dto: RegistrarControlDto, usuarioId: number) {
    const embarazo = await this.prisma.embarazo.findUnique({
      where: { id: dto.embarazoId },
      include: { paciente: true }
    });

    if (!embarazo || embarazo.estado !== EstadoEmbarazo.ACTIVO) {
      throw new BadRequestException('El embarazo no existe o no está activo');
    }

    // Priorizar semanas enviadas por el clínico (ajuste manual), de lo contrario calcular por FUM
    let semanas = dto.semanasGestacion;
    if (semanas === undefined && embarazo.fum) {
      const hoy = new Date();
      const difMs = hoy.getTime() - embarazo.fum.getTime();
      semanas = difMs / (1000 * 60 * 60 * 24 * 7);
    }

    const fechaControl = dto.fechaControl 
      ? new Date(dto.fechaControl) 
      : new Date(Date.now() - (new Date().getTimezoneOffset() * 60000));

    // 1. Crear automáticamente la entrada en Historia Clínica (Nota SOAP)
    const historia = await this.prisma.historiaClinica.create({
      data: {
        pacienteId: embarazo.pacienteId,
        medicoId: usuarioId,
        fecha: fechaControl,
        subjetivo: `Control Prenatal Periódico. Semanas: ${semanas?.toFixed(1) || '--'}.`,
        objetivo: `Peso Materno: ${dto.peso}kg, PA: ${dto.taSistolica}/${dto.taDiastolica}mmHg, AU: ${dto.alturaUterina || '--'}cm, FCF: ${dto.fcf || '--'}LPM, Mov.Fetales: ${dto.movimientosFetales ? 'SI' : 'NO'}, Proteinuria: ${dto.proteinuria ? 'POSITIVA' : 'NEGATIVA'}, Edema: ${dto.edema ? 'SI' : 'NO'}.`,
        analisis: `Control evolutivo de embarazo de ${embarazo.riesgo} riesgo. ${dto.proteinuria ? 'ALERTA: Proteinuria positiva detectada.' : ''} ${dto.observaciones || 'Sin hallazgos patológicos adicionales.'}`,
        plan: `Continuar control prenatal según cronograma. Próxima cita sugerida en ${embarazo.riesgo === RiesgoObstetrico.ALTO ? '1-2 semanas' : '4 semanas'}.`,
        diagnosticos: {
          create: {
            codigoCIE10: embarazo.riesgo === RiesgoObstetrico.ALTO ? 'Z35.9' : 'Z34.9',
            descripcion: embarazo.riesgo === RiesgoObstetrico.ALTO ? 'Supervisión de embarazo de alto riesgo' : 'Supervisión de embarazo normal',
            tipo: 'PRINCIPAL'
          }
        }
      }
    });

    // 2. Crear el Control Prenatal vinculado a la Historia Clínica creada
    const control = await this.prisma.controlPrenatal.create({
      data: {
        embarazoId: dto.embarazoId,
        historiaClinicaId: historia.id,
        fechaControl: fechaControl,
        semanasGestacion: semanas || 0,
        peso: dto.peso,
        taSistolica: dto.taSistolica,
        taDiastolica: dto.taDiastolica,
        alturaUterina: dto.alturaUterina,
        fcf: dto.fcf,
        movimientosFetales: dto.movimientosFetales,
        edema: dto.edema,
        proteinuria: dto.proteinuria,
        observaciones: dto.observaciones,
        creadoPorId: usuarioId
      }
    });

    // 3. Re-evaluar riesgo basado en signos vitales actuales
    if (dto.taSistolica >= 140 || dto.taDiastolica >= 90 || dto.proteinuria) {
      await this.prisma.embarazo.update({
        where: { id: dto.embarazoId },
        data: { riesgo: RiesgoObstetrico.ALTO }
      });
    }

    return control;
  }

  async getEmbarazoById(id: number) {
    return this.prisma.embarazo.findUnique({
      where: { id },
      include: {
        paciente: {
          include: { 
            estadoCivil: true,
            establecimiento: true
          }
        },
        antecedentes: true,
        controles: {
          include: {
            creadoPor: {
              select: {
                nombres: true,
                apellidos: true
              }
            }
          },
          orderBy: { fechaControl: 'asc' }
        }
      }
    });
  }

  async getEmbarazoActivo(pacienteId: number) {
    return this.prisma.embarazo.findFirst({
      where: {
        pacienteId,
        estado: EstadoEmbarazo.ACTIVO
      },
      include: {
        paciente: {
          include: {
            sexo: true,
            estadoCivil: true
          }
        },
        antecedentes: true,
        controles: {
          include: {
            creadoPor: {
              select: {
                nombres: true,
                apellidos: true
              }
            }
          },
          orderBy: { fechaControl: 'desc' }
        }
      }
    });
  }

  async getHistorialEmbarazos(pacienteId: number) {
    return this.prisma.embarazo.findMany({
      where: { pacienteId },
      include: {
        paciente: true,
        antecedentes: true,
        controles: {
          include: {
            creadoPor: {
              select: {
                nombres: true,
                apellidos: true
              }
            }
          },
          orderBy: { fechaControl: 'desc' }
        }
      },
      orderBy: { fechaCaptacion: 'desc' }
    });
  }

  async listarTodosActivos() {
    return this.prisma.embarazo.findMany({
      where: { estado: EstadoEmbarazo.ACTIVO },
      include: {
        paciente: true,
        controles: {
          orderBy: { fechaControl: 'desc' },
          take: 1
        },
        creadoPor: {
          select: {
            nombres: true,
            apellidos: true
          }
        }
      },
      orderBy: { fechaCaptacion: 'desc' }
    });
  }

  async buscarActivos(termino: string) {
    if (!termino) return this.listarTodosActivos();
    
    return this.prisma.embarazo.findMany({
      where: {
        OR: [
          { paciente: { nombres: { contains: termino } } },
          { paciente: { apellidos: { contains: termino } } },
          { paciente: { dni: { contains: termino } } }
        ]
      },
      include: {
        paciente: true,
        controles: {
          orderBy: { fechaControl: 'desc' },
          take: 1
        },
        creadoPor: {
          select: {
            nombres: true,
            apellidos: true
          }
        }
      },
      orderBy: { fechaCaptacion: 'desc' }
    });
  }
  async finalizarEmbarazo(dto: FinalizarEmbarazoDto, usuarioId: number) {
    const embarazo = await this.prisma.embarazo.findUnique({
      where: { id: dto.embarazoId }
    });

    if (!embarazo) {
      throw new NotFoundException('El registro de embarazo no existe');
    }

    if (embarazo.estado !== EstadoEmbarazo.ACTIVO) {
      throw new BadRequestException('El embarazo ya ha sido finalizado previamente');
    }

    return this.prisma.embarazo.update({
      where: { id: dto.embarazoId },
      data: {
        estado: dto.estado as any,
        fechaTerminacion: dto.fechaTerminacion ? new Date(dto.fechaTerminacion) : new Date(),
        observaciones: dto.observaciones 
          ? `${embarazo.observaciones || ''}\n--- FINALIZACIÓN (${new Date().toLocaleDateString()}): ${dto.observaciones}`
          : embarazo.observaciones,
        actualizadoPorId: usuarioId
      }
    });
  }

  async getPacienteByDni(dni: string) {
    return this.prisma.paciente.findUnique({
      where: { dni }
    });
  }
}
