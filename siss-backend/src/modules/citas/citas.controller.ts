import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('citas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CitasController {
  constructor(private readonly service: CitasService) {}

  @Post()
  @Permissions('citas:crear')
  crear(@Body() dto: CreateCitaDto, @CurrentUser() user: any) {
    const roles = user.rol ? [user.rol] : [];
    return this.service.crear(dto, user.establecimientoId, user.id, roles);
  }

  @Get()
  @Permissions('citas:leer')
  listar(@CurrentUser() user: any, @Query('fecha') fecha?: string) {
    // Pasamos el rol en un array para que el servicio pueda usar .includes()
    const roles = user.rol ? [user.rol] : [];
    return this.service.listar(user.establecimientoId, roles, user.id, fecha);
  }

  @Patch(':id/cancelar')
  @Permissions('citas:cancelar')
  cancelar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.cancelar(id, user.id);
  }

  @Patch(':id/no-asistio')
  @Permissions('citas:editar')
  noAsistio(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.noAsistio(id, user.id);
  }

  @Get('horario-disponible')
  @Permissions('citas:leer')
  obtenerHorarioDisponible(
    @Query('medicoId', ParseIntPipe) medicoId: number,
    @Query('fecha') fecha: string,
    @CurrentUser() user: any,
  ) {
    return this.service.obtenerSiguienteHorarioDisponible(
      medicoId,
      fecha,
      user.establecimientoId,
    );
  }
}
