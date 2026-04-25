import { Module } from '@nestjs/common';
import { ReferenciasService } from './referencias.service';
import { ReferenciasController } from './referencias.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReferenciasController],
  providers: [ReferenciasService],
  exports: [ReferenciasService],
})
export class ReferenciasModule {}
