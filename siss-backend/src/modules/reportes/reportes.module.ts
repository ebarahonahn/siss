import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { ReportesExportService } from './reportes-export.service';
import { ReporteAccesoGuard } from './reporte-acceso.guard';

@Module({
  controllers: [ReportesController],
  providers: [ReportesService, ReportesExportService, ReporteAccesoGuard],
})
export class ReportesModule {}
