import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConfiguracionDocumentoDto } from './dto/create-configuracion-documento.dto';
import { UpdateConfiguracionDocumentoDto } from './dto/update-configuracion-documento.dto';

const HISTORIAL_UNIFICADO = 'HISTORIAL_UNIFICADO';

const CONFIGURACION_HISTORIAL_UNIFICADO = {
  codigo: HISTORIAL_UNIFICADO,
  tituloEncabezado: 'REPÚBLICA DE HONDURAS - SECRETARÍA DE SALUD',
  subtitulo: 'EXPEDIENTE CLÍNICO UNIFICADO DEL PACIENTE',
  tituloVisor: 'Expediente clínico unificado',
  nombreArchivo: 'expediente-clinico-{expediente}.pdf',
};

@Injectable()
export class ConfiguracionService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Asegurar que exista al menos un registro de configuración
    const config = await this.prisma.configuracion.findFirst();
    if (!config) {
      await this.prisma.configuracion.create({
        data: {
          id: 1,
          siglasSistema: 'SISS',
          nombreSistema: 'Sistema Integral de Servicios de Salud',
        },
      });
    }

    // El upsert vacío preserva las personalizaciones existentes.
    await this.prisma.configuracionDocumento.upsert({
      where: { codigo: HISTORIAL_UNIFICADO },
      update: {},
      create: CONFIGURACION_HISTORIAL_UNIFICADO,
    });
  }

  async getConfig() {
    return this.prisma.configuracion.findFirst({
      select: {
        id: true,
        siglasSistema: true,
        nombreSistema: true,
        logoMimetype: true,
        actualizadoEn: true,
      },
    });
  }

  async findOne() {
    return this.prisma.configuracion.findFirst();
  }

  async update(data: { siglasSistema?: string; nombreSistema?: string; logo?: Buffer; logoMimetype?: string }) {
    const config = await this.prisma.configuracion.findFirst();
    const configId = config?.id || 1;
    return this.prisma.configuracion.update({
      where: { id: configId },
      data: {
        ...data,
        logo: data.logo ? (data.logo as any) : undefined,
      },
    });
  }

  async obtenerConfiguracionDocumento(codigo: string) {
    const configuracion = await this.prisma.configuracionDocumento.findUnique({
      where: { codigo: codigo.trim().toUpperCase() },
    });

    if (!configuracion) {
      throw new NotFoundException(`No existe configuración para el documento ${codigo}`);
    }

    return configuracion;
  }

  async listarConfiguracionesDocumento() {
    return this.prisma.configuracionDocumento.findMany({
      orderBy: { codigo: 'asc' },
    });
  }

  async crearConfiguracionDocumento(data: CreateConfiguracionDocumentoDto) {
    const codigo = data.codigo.trim().toUpperCase();
    const existe = await this.prisma.configuracionDocumento.findUnique({
      where: { codigo },
      select: { id: true },
    });

    if (existe) {
      throw new ConflictException(`Ya existe una configuración para el documento ${codigo}`);
    }

    return this.prisma.configuracionDocumento.create({
      data: {
        codigo,
        tituloEncabezado: data.tituloEncabezado,
        subtitulo: data.subtitulo,
        tituloVisor: data.tituloVisor,
        nombreArchivo: data.nombreArchivo,
      },
    });
  }

  async actualizarConfiguracionDocumento(codigo: string, data: UpdateConfiguracionDocumentoDto) {
    const codigoNormalizado = codigo.trim().toUpperCase();
    const existe = await this.prisma.configuracionDocumento.findUnique({
      where: { codigo: codigoNormalizado },
      select: { id: true },
    });

    if (!existe) {
      throw new NotFoundException(`No existe configuración para el documento ${codigo}`);
    }

    return this.prisma.configuracionDocumento.update({
      where: { codigo: codigoNormalizado },
      data,
    });
  }
}
