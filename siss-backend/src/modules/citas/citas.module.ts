import { Module } from '@nestjs/common';
import { CitasService } from './citas.service';
import { CitasController } from './citas.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AgendasModule } from '../agendas/agendas.module';

@Module({
  imports: [PrismaModule, AgendasModule],
  controllers: [CitasController],
  providers: [CitasService],
  exports: [CitasService],
})
export class CitasModule {}
