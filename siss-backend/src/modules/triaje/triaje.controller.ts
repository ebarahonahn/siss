import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TriajeService } from './triaje.service';
import { CrearTriajeDto } from './dto/crear-triaje.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('triaje')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TriajeController {
  constructor(private service: TriajeService) {}

  @Get('citas-pendientes')
  @Permissions('triaje:leer')
  citasPendientes(@CurrentUser() user: any, @Query('fecha') fecha?: string) {
    return this.service.citasPendientes(user, fecha);
  }

  @Post()
  @Permissions('triaje:crear')
  crear(@Body() dto: CrearTriajeDto, @CurrentUser() user: any) {
    return this.service.crear(dto, user.id);
  }

  @Get('cita/:citaId')
  @Permissions('triaje:leer,historia_clinica:leer,historia_clinica:crear')
  obtenerPorCita(@Param('citaId', ParseIntPipe) citaId: number) {
    return this.service.obtenerPorCita(citaId);
  }

  @Get(':id')
  @Permissions('triaje:leer,historia_clinica:leer,historia_clinica:crear')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtener(id);
  }
}
