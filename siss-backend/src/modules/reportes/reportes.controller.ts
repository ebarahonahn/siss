import {
  BadRequestException,
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
  ParseIntPipe,
} from '@nestjs/common';
import { resolverAlcanceReporte } from './reporte-alcance';
import { ReportesService } from './reportes.service';
import { ReportesExportService } from './reportes-export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DateUtils } from '../../common/utils/date-utils';
import type { Response } from 'express';
import { ReporteAccesoGuard, ReportePermitido } from './reporte-acceso.guard';

@Controller('reportes')
@UseGuards(JwtAuthGuard, ReporteAccesoGuard)
export class ReportesController {
  constructor(
    private readonly reportesService: ReportesService,
    private readonly exportService: ReportesExportService,
  ) {}

  @Get('dashboard-kpis')
  async getDashboardKPIs(
    @CurrentUser() user: any,
    @Query('establecimientoId') estId?: string,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
  ) {
    const { establecimientoId, usuarioId } = resolverAlcanceReporte(user, estId);
    const start = inicio ? new Date(inicio) : undefined;
    const end = fin ? new Date(fin) : undefined;
    const reportes = await this.reportesService.getMisReportes(user.id, user.rol, user.permisos, user.asignacionId, user.establecimientoId);
    return await this.reportesService.getDashboardKPIs(
      establecimientoId,
      start,
      end,
      reportes.map((reporte: { slug: string }) => reporte.slug),
      usuarioId,
    );
  }

  @Get('excel/productividad')
  @ReportePermitido('productividad')
  @Permissions('reportes:productividad')
  async exportExcelProductividad(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const { inicio: start, fin: end } = DateUtils.getLocalDayRange(inicio);
    // Para el reporte de fin, usamos el mismo helper pero con la fecha de fin
    const { fin: finalEnd } = DateUtils.getLocalDayRange(fin);
    const { establecimientoId, usuarioId } = resolverAlcanceReporte(user, estId);
    const data = await this.reportesService.getProductividadData(
      start,
      finalEnd,
      establecimientoId,
      usuarioId,
    );
    return await this.exportService.generarExcelProductividad(data, res);
  }

  @Get('excel/at-1')
  @ReportePermitido('at-1')
  @Permissions('reportes:at-1')
  async exportExcelAt1(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const fechaValida = (fecha: string) => /^\d{4}-\d{2}-\d{2}$/.test(fecha || '') &&
      !isNaN(Date.parse(fecha)) && new Date(fecha).toISOString().slice(0, 10) === fecha;
    if (!fechaValida(inicio) || !fechaValida(fin) || inicio > fin) {
      throw new BadRequestException('Seleccione un rango de fechas válido');
    }
    const { establecimientoId, usuarioId } = resolverAlcanceReporte(user, estId);
    const { inicio: start } = DateUtils.getLocalDayRange(inicio);
    const { fin: end } = DateUtils.getLocalDayRange(fin);
    const data = await this.reportesService.getAt1Data(start, end, establecimientoId, usuarioId);
    return this.exportService.generarExcelAt1(data, res, inicio, fin);
  }

  @Get('excel/inventario')
  @ReportePermitido('inventario')
  @Permissions('reportes:inventario')
  async exportExcelInventario(
    @CurrentUser() user: any,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const { establecimientoId, usuarioId } = resolverAlcanceReporte(user, estId);
    const data =
      await this.reportesService.getInventarioCriticoData(establecimientoId);
    return await this.exportService.generarExcelInventario(data, res);
  }

  @Get('excel/citas')
  @ReportePermitido('citas')
  @Permissions('reportes:citas')
  async exportExcelCitas(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const { inicio: start } = DateUtils.getLocalDayRange(inicio);
    const { fin: end } = DateUtils.getLocalDayRange(fin);
    const { establecimientoId, usuarioId } = resolverAlcanceReporte(user, estId);
    const data = await this.reportesService.getCitasData(
      start,
      end,
      establecimientoId,
      usuarioId,
    );
    return await this.exportService.generarExcelCitas(data, res);
  }

  @Get('excel/demografia')
  @ReportePermitido('demografia')
  @Permissions('reportes:demografia')
  async exportExcelDemografia(
    @CurrentUser() user: any,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const { establecimientoId, usuarioId } = resolverAlcanceReporte(user, estId);
    const data =
      await this.reportesService.getDemografiaData(establecimientoId, usuarioId);
    return await this.exportService.generarExcelDemografia(data, res);
  }

  @Get('excel/kardex')
  @ReportePermitido('kardex')
  @Permissions('reportes:kardex')
  async exportExcelKardex(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const start = new Date(inicio);
    const end = new Date(fin);
    end.setUTCHours(23, 59, 59, 999);
    const { establecimientoId, usuarioId } = resolverAlcanceReporte(user, estId);
    const data = await this.reportesService.getKardexData(
      start,
      end,
      establecimientoId,
      usuarioId,
    );
    return await this.exportService.generarExcelKardex(data, res);
  }

  @Get('excel/consolidado-pai')
  @ReportePermitido('consolidado-pai')
  @Permissions('vacunacion:leer')
  async exportExcelPai(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const { inicio: start } = DateUtils.getLocalDayRange(inicio);
    const { fin: end } = DateUtils.getLocalDayRange(fin);
    const { establecimientoId, usuarioId } = resolverAlcanceReporte(user, estId);
    const data = await this.reportesService.getConsolidadoPaiData(start, end, establecimientoId, usuarioId);
    return await this.exportService.generarExcelPai(data, res);
  }

  @Get('excel/inventario-vacunas')
  @ReportePermitido('inventario-vacunas')
  @Permissions('vacunacion:leer')
  async exportExcelInventarioVacunas(
    @CurrentUser() user: any,
    @Query('establecimientoId') estId: string,
    @Res() res: Response,
  ) {
    const { establecimientoId, usuarioId } = resolverAlcanceReporte(user, estId);
    const data = await this.reportesService.getInventarioVacunasData(establecimientoId);
    return await this.exportService.generarExcelInventarioVacunas(data, res);
  }

  @Get('morbilidad')
  @ReportePermitido('morbilidad')
  @Permissions('reportes:morbilidad')
  async getMorbilidad(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
  ) {
    const { inicio: start } = DateUtils.getLocalDayRange(inicio);
    const { fin: end } = DateUtils.getLocalDayRange(fin);
    const { establecimientoId, usuarioId } = resolverAlcanceReporte(user, estId);
    return await this.reportesService.getMorbilidadData(
      start,
      end,
      establecimientoId,
      usuarioId,
    );
  }

  @Get('cobertura')
  @ReportePermitido('cobertura-vacunacion')
  @Permissions('vacunacion:leer')
  async getCobertura(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Query('establecimientoId') estId: string,
  ) {
    const { inicio: start } = DateUtils.getLocalDayRange(inicio);
    const { fin: end } = DateUtils.getLocalDayRange(fin);
    const { establecimientoId, usuarioId } = resolverAlcanceReporte(user, estId);
    return await this.reportesService.getCoberturaData(start, end, establecimientoId, usuarioId);
  }

  @Get('mis-reportes')
  async getMisReportes(@CurrentUser() user: any) {
    return await this.reportesService.getMisReportes(user.id, user.rol, user.permisos, user.asignacionId, user.establecimientoId);
  }

  @Get('usuario/:usuarioId')
  @Permissions('gestion_reportes:leer,gestion_reportes:gestionar,reportes:gestionar,reportes')
  async getReportesPorUsuario(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return await this.reportesService.getReportesPorUsuario(usuarioId);
  }

  @Post('usuario/:usuarioId')
  @Permissions('gestion_reportes:gestionar,reportes:gestionar,reportes')
  async asignarReportesAUsuario(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() body: any,
  ) {
    const reporteIds = Array.isArray(body?.reporteIds) ? body.reporteIds : [];
    return await this.reportesService.asignarReportesAUsuario(usuarioId, reporteIds);
  }

  @Get('disponibles')
  async getDisponibles() {
    return await this.reportesService.getReportesDisponibles();
  }

  @Post('disponibles')
  @Permissions('gestion_reportes:gestionar,reportes:gestionar')
  async crear(@Body() data: any) {
    return await this.reportesService.crearReporte(data);
  }

  @Patch('disponibles/:id')
  @Permissions('gestion_reportes:gestionar,reportes:gestionar')
  async actualizar(@Param('id') id: string, @Body() data: any) {
    return await this.reportesService.actualizarReporte(parseInt(id), data);
  }

  @Delete('disponibles/:id')
  @Permissions('gestion_reportes:gestionar,reportes:gestionar')
  async eliminar(@Param('id') id: string) {
    return await this.reportesService.eliminarReporte(parseInt(id));
  }
}
