import { Module } from '@nestjs/common';
import { DispensacionService } from './dispensacion.service';
import { DispensacionController } from './dispensacion.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DispensacionController],
  providers: [DispensacionService],
  exports: [DispensacionService],
})
export class DispensacionModule {}
