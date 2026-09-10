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
@UseGuards(JwtAuthGuard)
export class CitasController {
  constructor(private readonly service: CitasService) {}

  @Get('ping-status')
  ping() {
    return { status: 'online', timestamp: new Date().toISOString() };
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('citas:crear')
  crear(@Body() dto: CreateCitaDto, @CurrentUser() user: any) {
    const roles = user.rol ? [user.rol] : [];
    const establecimientoId = (dto as any).establecimientoId || user.establecimientoId;
    return this.service.crear(dto, establecimientoId, user.id, roles, {
      asignacionId: user.asignacionId ?? null,
      servicioId: user.servicioId ?? null,
      especialidadId: user.especialidadId ?? null,
    });
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('citas:leer,historia_clinica:leer')
  listar(@CurrentUser() user: any, @Query('fecha') fecha?: string) {
    // Pasamos el rol en un array para que el servicio pueda usar .includes()
    const roles = user.rol ? [user.rol] : [];
    return this.service.listar(
      user.establecimientoId,
      roles,
      user.id,
      fecha,
      user.dni,
      {
        asignacionId: user.asignacionId ?? null,
        servicioId: user.servicioId ?? null,
        especialidadId: user.especialidadId ?? null,
      },
    );
  }

  @Patch(':id/confirmar')
  @UseGuards(PermissionsGuard)
  @Permissions('citas:editar')
  confirmar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.confirmar(id, user);
  }

  @Patch(':id/cancelar')
  @UseGuards(PermissionsGuard)
  @Permissions('citas:cancelar,citas:marcar-no-asistio,citas:editar')
  cancelar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.cancelar(id, user.id);
  }

  @Patch(':id/no-asistio')
  @UseGuards(PermissionsGuard)
  @Permissions('citas:marcar-no-asistio,citas:cancelar,citas:editar,historia_clinica:crear,citas:leer')
  noAsistio(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.noAsistio(id, user.id);
  }

  @Get('horario-disponible')
  @UseGuards(PermissionsGuard)
  @Permissions('citas:leer')
  obtenerHorarioDisponible(
    @Query('medicoId', ParseIntPipe) medicoId: number,
    @Query('fecha') fecha: string,
    @Query('establecimientoId') establecimientoIdQuery?: any,
    @CurrentUser() user?: any,
  ) {
    const establecimientoId = (establecimientoIdQuery && establecimientoIdQuery !== 'undefined') 
      ? Number(establecimientoIdQuery) 
      : user.establecimientoId;
    return this.service.obtenerSiguienteHorarioDisponible(
      medicoId,
      fecha,
      establecimientoId,
    );
  }
}
