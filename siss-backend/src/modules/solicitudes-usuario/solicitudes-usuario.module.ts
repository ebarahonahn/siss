import { Module } from '@nestjs/common';
import { SolicitudesUsuarioController } from './solicitudes-usuario.controller';
import { SolicitudesUsuarioService } from './solicitudes-usuario.service';

import { PrismaModule } from '../../prisma/prisma.module';
import { MailService } from '../../common/services/mail.service';

@Module({
  imports: [PrismaModule],
  controllers: [SolicitudesUsuarioController],
  providers: [SolicitudesUsuarioService, MailService]
})
export class SolicitudesUsuarioModule {}
