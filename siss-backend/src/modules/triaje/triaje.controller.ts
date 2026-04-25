import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';
import { TriajeService } from './triaje.service';
import { CrearTriajeDto } from './dto/crear-triaje.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('triaje')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TriajeController {
  constructor(private service: TriajeService) {}

  @Get('citas-pendientes')
  @Roles('ENFERMERA', 'ADMIN', 'MEDICO')
  citasPendientes(@CurrentUser() user: any, @Query('fecha') fecha?: string) {
    return this.service.citasPendientes(user.establecimientoId, fecha);
  }

  @Post()
  @Roles('ENFERMERA', 'ADMIN')
  crear(@Body() dto: CrearTriajeDto, @CurrentUser() user: any) {
    return this.service.crear(dto, user.id);
  }

  @Get('cita/:citaId')
  @Roles('ENFERMERA', 'ADMIN', 'MEDICO')
  obtenerPorCita(@Param('citaId', ParseIntPipe) citaId: number) {
    return this.service.obtenerPorCita(citaId);
  }

  @Get(':id')
  @Roles('ENFERMERA', 'ADMIN', 'MEDICO')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtener(id);
  }
}
