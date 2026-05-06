import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DispensacionService } from './dispensacion.service';
import { CreateDispensacionDto } from './dto/create-dispensacion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@ApiTags('Farmacia - Dispensación')
@ApiBearerAuth()
@Controller('dispensacion')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispensacionController {
  constructor(private service: DispensacionService) {}

  @ApiOperation({ summary: 'Buscar recetas pendientes de dispensar', description: 'Busca recetas en estado PENDIENTE o PARCIAL para un paciente.' })
  @ApiQuery({ name: 'identificador', description: 'DNI, Exp o Nombre del paciente' })
  @Permissions('farmacia:leer')
  @Get('recetas-pendientes')
  listarPendientes(
    @Query('identificador') identificador: string,
    @Req() req: any,
  ) {
    return this.service.buscarRecetasPendientes(
      identificador,
      req.user.establecimientoId,
    );
  }

  @ApiOperation({ summary: 'Registrar una dispensación (Entrega)', description: 'Realiza el descargo de inventario por lotes (FEFO) y actualiza el estado de la receta.' })
  @ApiResponse({ status: 201, description: 'Dispensación registrada exitosamente' })
  @Permissions('farmacia:crear')
  @Post()
  dispensar(@Body() dto: CreateDispensacionDto, @Req() req: any) {
    return this.service.dispensar(dto, req.user.id, req.user.establecimientoId);
  }

  @Get('validar-pendiente')
  @Permissions('recetas:leer')
  validarPendiente(
    @Query('pacienteId', ParseIntPipe) pacienteId: number,
    @Query('medicamentoId', ParseIntPipe) medicamentoId: number,
  ) {
    return this.service.revisarMedicamentoPendiente(pacienteId, medicamentoId);
  }

  @Get('config/vigencia')
  @Permissions('farmacia:leer')
  obtenerVigencia() {
    return this.service.obtenerVigenciaReceta();
  }

  @Get('historial-paciente')
  @Permissions('recetas:leer')
  historialPaciente(
    @Query('identificador') identificador: string,
  ) {
    return this.service.historialPorPaciente(identificador);
  }
}
