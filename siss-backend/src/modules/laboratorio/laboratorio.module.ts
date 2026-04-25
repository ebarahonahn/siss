import { Module } from '@nestjs/common';
import { LaboratorioService } from './laboratorio.service';
import { LaboratorioController } from './laboratorio.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LaboratorioController],
  providers: [LaboratorioService],
  exports: [LaboratorioService],
})
export class LaboratorioModule {}
