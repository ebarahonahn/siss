import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSolicitudUsuarioDto } from './dto/create-solicitud-usuario.dto';
import { MailService } from '../../common/services/mail.service';
import { EstadoSolicitud, SolicitudUsuario } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SolicitudesUsuarioService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async crear(dto: CreateSolicitudUsuarioDto) {
    const existe = await this.prisma.solicitudUsuario.findFirst({
      where: {
        OR: [
          { dni: dto.dni },
          { correo: dto.correo },
        ],
        estado: 'PENDIENTE',
      },
    });

    if (existe) {
      throw new ConflictException('Ya existe una solicitud pendiente con este DNI o correo');
    }

    return this.prisma.solicitudUsuario.create({
      data: {
        dni: dto.dni,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        correo: dto.correo,
        telefono: dto.telefono,
        justificacion: dto.justificacion,
      },
    });
  }

  async listar(estado?: EstadoSolicitud) {
    return this.prisma.solicitudUsuario.findMany({
      where: estado ? { estado } : {},
      orderBy: { creadaEn: 'desc' },
      include: {
        procesadaPor: {
          select: { id: true, nombres: true, apellidos: true }
        }
      }
    });
  }

  async obtener(id: number) {
    const solicitud = await this.prisma.solicitudUsuario.findUnique({
      where: { id },
      include: {
        procesadaPor: {
          select: { id: true, nombres: true, apellidos: true }
        }
      }
    });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    return solicitud;
  }

  async procesar(id: number, usuarioId: number, estado: EstadoSolicitud, observaciones?: string) {
    const solicitud = await this.obtener(id);

    if (solicitud.estado !== 'PENDIENTE') {
      throw new ConflictException('La solicitud ya ha sido procesada');
    }

    let claveTemporal: string | undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      const solicitudActualizada = await tx.solicitudUsuario.update({
        where: { id },
        data: {
          estado,
          observaciones,
          procesadaEn: new Date(),
          procesadaPorId: usuarioId,
        },
      });

      if (estado === 'APROBADA') {
        claveTemporal = crypto.randomBytes(4).toString('hex');
        const hash = await bcrypt.hash(claveTemporal, 12);

        // Intentar vincular con un expediente clínico existente
        const pacienteExistente = await tx.paciente.findUnique({
          where: { dni: solicitud.dni },
          select: { id: true }
        });

        // Crear la cuenta aislada de paciente
        await tx.pacienteUsuario.create({
          data: {
            pacienteId: pacienteExistente?.id || null,
            dni: solicitud.dni,
            correo: solicitud.correo,
            contrasenaHash: hash,
            requiereCambioContrasena: true,
          },
        });
      }

      return solicitudActualizada;
    });

    // Envío de correos (Fuera de la transacción para evitar bloqueos)
    try {
      if (estado === 'APROBADA' && claveTemporal) {
        await this.enviarCorreoAprobacion(solicitud, claveTemporal);
      } else if (estado === 'RECHAZADA') {
        await this.enviarCorreoRechazo(solicitud, observaciones);
      }
    } catch (error) {
      console.error('Error enviando correo de notificación:', error);
      // No lanzamos excepción aquí para no revertir la aprobación en DB, 
      // pero el usuario debería ser notificado de alguna forma.
    }

    return updated;
  }

  private async enviarCorreoAprobacion(solicitud: SolicitudUsuario, clave: string) {
    const subject = 'Solicitud de Cuenta Aprobada - SISS';
    const text = `Hola ${solicitud.nombres},\n\nTu solicitud de acceso al SISS ha sido aprobada. Tu clave temporal es: ${clave}\n\nPor favor inicia sesión y cambia tu contraseña.\n\nSaludos,\nEquipo SISS`;
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #10b981;">¡Solicitud Aprobada!</h2>
        <p>Hola <strong>${solicitud.nombres}</strong>,</p>
        <p>Nos complace informarte que tu solicitud de acceso al <strong>Sistema Integral de Servicios de Salud (SISS)</strong> ha sido aprobada.</p>
        <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #166534;">Tu clave temporal de acceso es:</p>
          <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #064e3b; letter-spacing: 2px;">${clave}</p>
        </div>
        <p>Utiliza esta clave para tu primer ingreso. El sistema te solicitará cambiarla por una nueva por motivos de seguridad.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Este es un mensaje automático del Sistema SISS.</p>
      </div>
    `;

    await this.mailService.sendMail(solicitud.correo, subject, text, html);
  }

  private async enviarCorreoRechazo(solicitud: SolicitudUsuario, observaciones?: string) {
    const subject = 'Información sobre su solicitud de cuenta - SISS';
    const text = `Hola ${solicitud.nombres},\n\nLamentamos informarte que tu solicitud de cuenta no ha sido aprobada en este momento.\n\nObservaciones: ${observaciones || 'No especificadas'}\n\nSaludos,\nEquipo SISS`;
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #ef4444;">Estado de su Solicitud</h2>
        <p>Hola <strong>${solicitud.nombres}</strong>,</p>
        <p>Te informamos que tu solicitud de acceso al sistema no ha sido aprobada en esta ocasión.</p>
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; font-weight: bold; color: #991b1b;">Motivo / Observaciones:</p>
          <p style="margin: 8px 0 0 0; color: #7f1d1d;">${observaciones || 'No se proporcionaron detalles adicionales.'}</p>
        </div>
        <p>Si consideras que esto es un error o deseas proporcionar más información, por favor contacta al administrador de tu centro.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Mensaje automático del Sistema SISS.</p>
      </div>
    `;

    await this.mailService.sendMail(solicitud.correo, subject, text, html);
  }
}
