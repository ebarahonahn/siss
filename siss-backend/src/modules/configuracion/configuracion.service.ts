import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
}
