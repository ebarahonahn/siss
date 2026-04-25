
import { Module } from '@nestjs/common';
import { VacunacionService } from './vacunacion.service';
import { VacunacionController } from './vacunacion.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VacunacionController],
  providers: [VacunacionService],
  exports: [VacunacionService]
})
export class VacunacionModule {}
