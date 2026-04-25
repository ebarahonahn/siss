import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { ReportesExportService } from './reportes-export.service';

@Module({
  controllers: [ReportesController],
  providers: [ReportesService, ReportesExportService],
})
export class ReportesModule {}
