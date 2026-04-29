import { Module } from '@nestjs/common';
import { HospitalizacionService } from './hospitalizacion.service';
import { HospitalizacionController } from './hospitalizacion.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PdfService } from '../../common/services/pdf.service';

@Module({
  imports: [PrismaModule],
  controllers: [HospitalizacionController],
  providers: [HospitalizacionService, PdfService],
  exports: [HospitalizacionService]
})
export class HospitalizacionModule {}
