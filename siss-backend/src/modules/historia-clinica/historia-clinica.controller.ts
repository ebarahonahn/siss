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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HistoriaClinicaService } from './historia-clinica.service';
import { CreateHistoriaClinicaDto } from './dto/create-historia-clinica.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@ApiTags('Atención Médica - Historia Clínica')
@ApiBearerAuth()
@Controller('historia-clinica')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HistoriaClinicaController {
  constructor(private service: HistoriaClinicaService) {}

  @ApiOperation({ summary: 'Registrar un encuentro médico (Historia Clínica)', description: 'Crea una nota clínica y orquesta la creación de recetas, laboratorios, incapacidades y referencias en una sola transacción.' })
  @ApiResponse({ status: 201, description: 'Nota clínica creada exitosamente' })
  @Permissions('historia_clinica:crear')
  @Post()
  crear(@Body() dto: CreateHistoriaClinicaDto, @Req() req: any) {
    console.log('--- REQUERIMIENTO RECIBIDO ---');
    console.log('DTO:', JSON.stringify(dto, null, 2));
    console.log('User ID:', req.user.id);
    console.log('Establecimiento ID:', req.user.establecimientoId);
    return this.service.crear(dto, req.user.id, req.user.establecimientoId);
  }

  @Get('paciente/:pacienteId/historial-unificado')
  @Permissions('historial_unificado:leer,historia_clinica:leer,pacientes:leer')
  obtenerHistorialUnificado(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.service.obtenerHistorialUnificado(pacienteId);
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
