import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesExportService } from './reportes-export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { DateUtils } from '../../common/utils/date-utils';
import type { Response } from 'express';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(
    private readonly reportesService: ReportesService,
    private readonly exportService: ReportesExportService,
  ) {}

  @Get('dashboard-kpis')
  async getDashboardKPIs(
    @Query('establecimientoId') estId?: string,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
  ) {
    const establecimientoId = estId ? parseInt(estId) : undefined;
    const start = inicio ? new Date(inicio) : undefined;
    const end = fin ? new Date(fin) : undefined;
    return await this.reportesService.getDashboardKPIs(
      establecimientoId,
      start,
      end,
    );
  }

  @Get('excel/productividad')
  @Permissions('reportes:productividad')
  async exportExcelProductividad(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const { inicio: start, fin: end } = DateUtils.getLocalDayRange(inicio);
    // Para el reporte de fin, usamos el mismo helper pero con la fecha de fin
    const { fin: finalEnd } = DateUtils.getLocalDayRange(fin);
    const establecimientoId = estId ? parseInt(estId) : undefined;
    const data = await this.reportesService.getProductividadData(
      start,
      finalEnd,
      establecimientoId,
    );
    return await this.exportService.generarExcelProductividad(data, res);
  }

  @Get('excel/inventario')
  @Permissions('reportes:inventario')
  async exportExcelInventario(
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const establecimientoId = estId ? parseInt(estId) : undefined;
    const data =
      await this.reportesService.getInventarioCriticoData(establecimientoId);
    return await this.exportService.generarExcelInventario(data, res);
  }

  @Get('excel/citas')
  @Permissions('reportes:citas')
  async exportExcelCitas(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const { inicio: start } = DateUtils.getLocalDayRange(inicio);
    const { fin: end } = DateUtils.getLocalDayRange(fin);
    const establecimientoId = estId ? parseInt(estId) : undefined;
    const data = await this.reportesService.getCitasData(
      start,
      end,
      establecimientoId,
    );
    return await this.exportService.generarExcelCitas(data, res);
  }

  @Get('excel/demografia')
  @Permissions('reportes:demografia')
  async exportExcelDemografia(
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const establecimientoId = estId ? parseInt(estId) : undefined;
    const data =
      await this.reportesService.getDemografiaData(establecimientoId);
    return await this.exportService.generarExcelDemografia(data, res);
  }

  @Get('excel/kardex')
  @Permissions('reportes:kardex')
  async exportExcelKardex(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const start = new Date(inicio);
    const end = new Date(fin);
    end.setUTCHours(23, 59, 59, 999);
    const establecimientoId = estId ? parseInt(estId) : undefined;
    const data = await this.reportesService.getKardexData(
      start,
      end,
      establecimientoId,
    );
    return await this.exportService.generarExcelKardex(data, res);
  }

  @Get('excel/consolidado-pai')
  @Permissions('vacunacion:leer')
  async exportExcelPai(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const { inicio: start } = DateUtils.getLocalDayRange(inicio);
    const { fin: end } = DateUtils.getLocalDayRange(fin);
    const establecimientoId = estId ? parseInt(estId) : undefined;
    const data = await this.reportesService.getConsolidadoPaiData(start, end, establecimientoId);
    return await this.exportService.generarExcelPai(data, res);
  }

  @Get('excel/inventario-vacunas')
  @Permissions('vacunacion:leer')
  async exportExcelInventarioVacunas(
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const establecimientoId = estId ? parseInt(estId) : undefined;
    const data = await this.reportesService.getInventarioVacunasData(establecimientoId);
    return await this.exportService.generarExcelInventarioVacunas(data, res);
  }

  @Get('morbilidad')
  @Permissions('reportes:morbilidad')
  async getMorbilidad(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
  ) {
    const { inicio: start } = DateUtils.getLocalDayRange(inicio);
    const { fin: end } = DateUtils.getLocalDayRange(fin);
    const establecimientoId = estId ? parseInt(estId) : undefined;
    return await this.reportesService.getMorbilidadData(
      start,
      end,
      establecimientoId,
    );
  }

  @Get('cobertura')
  @Permissions('vacunacion:leer')
  async getCobertura(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
  ) {
    const { inicio: start } = DateUtils.getLocalDayRange(inicio);
    const { fin: end } = DateUtils.getLocalDayRange(fin);
    const establecimientoId = estId ? parseInt(estId) : undefined;
    return await this.reportesService.getCoberturaData(start, end, establecimientoId);
  }

  @Get('disponibles')
  async getDisponibles() {
    return await this.reportesService.getReportesDisponibles();
  }

  @Post('disponibles')
  @Permissions('reportes:gestionar')
  async crear(@Body() data: any) {
    return await this.reportesService.crearReporte(data);
  }

  @Patch('disponibles/:id')
  @Permissions('reportes:gestionar')
  async actualizar(@Param('id') id: string, @Body() data: any) {
    return await this.reportesService.actualizarReporte(parseInt(id), data);
  }

  @Delete('disponibles/:id')
  @Permissions('reportes:gestionar')
  async eliminar(@Param('id') id: string) {
    return await this.reportesService.eliminarReporte(parseInt(id));
  }
}
