import { Module } from '@nestjs/common';
import { ControlPrenatalService } from './control-prenatal.service';
import { ControlPrenatalExportService } from './control-prenatal-export.service';
import { ControlPrenatalController } from './control-prenatal.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PdfService } from '../../common/services/pdf.service';

@Module({
  imports: [PrismaModule],
  controllers: [ControlPrenatalController],
  providers: [ControlPrenatalService, ControlPrenatalExportService, PdfService],
  exports: [ControlPrenatalService]
})
export class ControlPrenatalModule {}
