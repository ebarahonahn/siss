
import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { VacunacionService } from './vacunacion.service';
import { RegistrarVacunacionDto } from './dto/registrar-vacunacion.dto';
import { CrearLoteDto } from './dto/crear-lote.dto';
import { CrearVacunaDto } from './dto/crear-vacuna.dto';
import { CrearEsquemaDto } from './dto/crear-esquema.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('vacunacion')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VacunacionController {
  constructor(private readonly vacunacionService: VacunacionService) {}

  @Get('catalogo')
  @Permissions('vacunacion:leer')
  listarVacunas() {
    return this.vacunacionService.listarVacunas();
  }

  @Get('lotes/:establecimientoId')
  @Permissions('vacunacion:leer,inventario_vacunas:leer')
  listarLotes(@Param('establecimientoId', ParseIntPipe) estId: number, @Query('vacunaId') vacunaId?: number) {
    return this.vacunacionService.obtenerLotes(estId, vacunaId ? Number(vacunaId) : undefined);
  }

  @Put('lotes/:id')
  @Permissions('vacunacion:editar,inventario_vacunas:gestionar')
  actualizarLote(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.vacunacionService.actualizarLote(id, dto);
  }

  @Delete('lotes/:id')
  @Permissions('vacunacion:eliminar,inventario_vacunas:gestionar')
  eliminarLote(@Param('id', ParseIntPipe) id: number) {
    return this.vacunacionService.eliminarLote(id);
  }

  @Post('registrar')
  @Permissions('vacunacion:gestionar')
  registrarAplicacion(@Body() dto: RegistrarVacunacionDto, @CurrentUser() user: any) {
    return this.vacunacionService.registrarAplicacion(dto, user.id);
  }

  @Get('historial/:pacienteId')
  @Permissions('vacunacion:leer')
  obtenerHistorial(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.vacunacionService.obtenerHistorialPaciente(pacienteId);
  }

  @Post('lotes')
  @Permissions('vacunacion:gestionar,inventario_vacunas:gestionar')
  crearLote(@Body() dto: CrearLoteDto, @CurrentUser() user: any) {
    return this.vacunacionService.crearLote(dto, user.id);
  }

  @Post('lotes/movimiento')
  @Permissions('vacunacion:gestionar,inventario_vacunas:gestionar')
  registrarMovimientoManual(@Body() dto: any, @CurrentUser() user: any) {
    return this.vacunacionService.registrarMovimientoManual(dto, user.id);
  }

  @Get('lotes/:loteId/movimientos')
  @Permissions('vacunacion:leer,inventario_vacunas:leer')
  obtenerMovimientos(@Param('loteId', ParseIntPipe) loteId: number) {
    // Implementar en service si se desea ver el historial por lote
    return this.vacunacionService.obtenerMovimientos(loteId);
  }

  // --- ENDPOINTS DE MANTENIMIENTO ---

  @Get('mantenimiento')
  @Permissions('vacunacion:leer')
  listarVacunasMantenimiento(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ) {
    return this.vacunacionService.listarVacunasMantenimiento(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      search
    );
  }

  @Get('mantenimiento/:id')
  @Permissions('vacunacion:leer')
  obtenerVacunaMantenimiento(@Param('id', ParseIntPipe) id: number) {
    return this.vacunacionService.obtenerVacunaMantenimiento(id);
  }

  @Post('mantenimiento')
  @Permissions('vacunacion:gestionar')
  crearVacuna(@Body() dto: CrearVacunaDto) {
    return this.vacunacionService.crearVacuna(dto);
  }

  @Put('mantenimiento/:id')
  @Permissions('vacunacion:gestionar')
  actualizarVacuna(@Param('id', ParseIntPipe) id: number, @Body() dto: CrearVacunaDto) {
    return this.vacunacionService.actualizarVacuna(id, dto);
  }

  @Delete('mantenimiento/:id')
  @Permissions('vacunacion:gestionar')
  desactivarVacuna(@Param('id', ParseIntPipe) id: number) {
    return this.vacunacionService.desactivarVacuna(id);
  }

  @Post('mantenimiento/:id/esquemas')
  @Permissions('vacunacion:gestionar')
  crearEsquema(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearEsquemaDto,
    @CurrentUser() user: any
  ) {
    return this.vacunacionService.crearEsquema(id, dto, user.id);
  }

  @Put('mantenimiento/:id/esquemas/:esquemaId')
  @Permissions('vacunacion:gestionar')
  actualizarEsquema(
    @Param('id', ParseIntPipe) id: number,
    @Param('esquemaId', ParseIntPipe) esquemaId: number,
    @Body() dto: CrearEsquemaDto,
    @CurrentUser() user: any
  ) {
    return this.vacunacionService.actualizarEsquema(id, esquemaId, dto, user.id);
  }

  @Delete('mantenimiento/:id/esquemas/:esquemaId')
  @Permissions('vacunacion:gestionar')
  eliminarEsquema(
    @Param('id', ParseIntPipe) id: number,
    @Param('esquemaId', ParseIntPipe) esquemaId: number,
    @CurrentUser() user: any
  ) {
    return this.vacunacionService.eliminarEsquema(id, esquemaId, user.id);
  }
}
