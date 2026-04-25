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
import { DispensacionService } from './dispensacion.service';
import { CreateDispensacionDto } from './dto/create-dispensacion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('dispensacion')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispensacionController {
  constructor(private service: DispensacionService) {}

  @Get('recetas-pendientes')
  @Permissions('farmacia:leer')
  listarPendientes(
    @Query('identificador') identificador: string,
    @Req() req: any,
  ) {
    return this.service.buscarRecetasPendientes(
      identificador,
      req.user.establecimientoId,
    );
  }

  @Post()
  @Permissions('farmacia:crear')
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
}
