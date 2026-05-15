import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ControlPrenatalExportService {
  constructor(private prisma: PrismaService) {}

  async exportarSipPlus(embarazoId: number) {
    const embarazo = await this.prisma.embarazo.findUnique({
      where: { id: embarazoId },
      include: {
        paciente: {
          include: {
            sexo: true,
            estadoCivil: true,
            escolaridad: true
          }
        },
        antecedentes: true,
        controles: {
          orderBy: { fechaControl: 'asc' }
        }
      }
    });

    if (!embarazo) return null;

    // Transformación al esquema SIP Plus
    return {
      identificacion: {
        nombres: embarazo.paciente.nombres,
        apellidos: embarazo.paciente.apellidos,
        dni: embarazo.paciente.dni,
        fecha_nacimiento: embarazo.paciente.fechaNacimiento,
        estado_civil: embarazo.paciente.estadoCivil?.nombre || 'S/D',
        escolaridad: embarazo.paciente.escolaridad?.nombre || 'S/D'
      },
      antecedentes: {
        gravidez: embarazo.antecedentes?.gravidez || 0,
        partos: embarazo.antecedentes?.partos || 0,
        abortos: embarazo.antecedentes?.abortos || 0,
        cesareas: embarazo.antecedentes?.cesareas || 0,
        ultimo_embarazo_previo: embarazo.antecedentes?.ultimoEmbarazoPrevio
      },
      embarazo_actual: {
        fum: embarazo.fum,
        fpp: embarazo.fpp,
        fecha_captacion: embarazo.fechaCaptacion,
        riesgo_inicial: embarazo.riesgo
      },
      controles: embarazo.controles.map(c => ({
        fecha: c.fechaControl,
        semanas: c.semanasGestacion,
        peso: c.peso,
        pa_sistolica: c.taSistolica,
        pa_diastolica: c.taDiastolica,
        altura_uterina: c.alturaUterina,
        fcf: c.fcf,
        proteinuria: c.proteinuria ? 'Positivo' : 'Negativo'
      }))
    };
  }
}
