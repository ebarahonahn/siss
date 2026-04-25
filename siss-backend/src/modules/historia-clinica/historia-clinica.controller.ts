import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { HistoriaClinicaService } from './historia-clinica.service';
import { CreateHistoriaClinicaDto } from './dto/create-historia-clinica.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('historia-clinica')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HistoriaClinicaController {
  constructor(private service: HistoriaClinicaService) {}

  @Post()
  @Permissions('historia_clinica:crear')
  crear(@Body() dto: CreateHistoriaClinicaDto, @Req() req: any) {
    console.log('--- REQUERIMIENTO RECIBIDO ---');
    console.log('DTO:', JSON.stringify(dto, null, 2));
    console.log('User ID:', req.user.id);
    console.log('Establecimiento ID:', req.user.establecimientoId);
    return this.service.crear(dto, req.user.id, req.user.establecimientoId);
  }

  @Get('paciente/:pacienteId')
  @Permissions('historia_clinica:leer')
  listarPorPaciente(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.service.listarPorPaciente(pacienteId);
  }

  @Get(':id')
  @Permissions('historia_clinica:leer')
  obtenerDetalle(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerDetalle(id);
  }
}
