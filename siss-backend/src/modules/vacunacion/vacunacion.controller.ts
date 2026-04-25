
import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { VacunacionService } from './vacunacion.service';
import { RegistrarVacunacionDto } from './dto/registrar-vacunacion.dto';
import { CrearLoteDto } from './dto/crear-lote.dto';
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
  @Permissions('vacunacion:leer')
  listarLotes(@Param('establecimientoId', ParseIntPipe) estId: number, @Query('vacunaId') vacunaId?: number) {
    return this.vacunacionService.obtenerLotes(estId, vacunaId ? Number(vacunaId) : undefined);
  }

  @Put('lotes/:id')
  @Permissions('vacunacion:editar')
  actualizarLote(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.vacunacionService.actualizarLote(id, dto);
  }

  @Delete('lotes/:id')
  @Permissions('vacunacion:eliminar')
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
  @Permissions('vacunacion:gestionar')
  crearLote(@Body() dto: CrearLoteDto, @CurrentUser() user: any) {
    return this.vacunacionService.crearLote(dto, user.id);
  }

  @Post('lotes/movimiento')
  @Permissions('vacunacion:gestionar')
  registrarMovimientoManual(@Body() dto: any, @CurrentUser() user: any) {
    return this.vacunacionService.registrarMovimientoManual(dto, user.id);
  }

  @Get('lotes/:loteId/movimientos')
  @Permissions('vacunacion:leer')
  obtenerMovimientos(@Param('loteId', ParseIntPipe) loteId: number) {
    // Implementar en service si se desea ver el historial por lote
    return this.vacunacionService.obtenerMovimientos(loteId);
  }
}
