import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { EstablecimientosService } from './establecimientos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateEstablecimientoDto } from './dto/create-establecimiento.dto';
import { UpdateEstablecimientoDto } from './dto/update-establecimiento.dto';

@Controller('establecimientos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EstablecimientosController {
  constructor(private service: EstablecimientosService) {}

  @Get('mis-servicios')
  listarServiciosPropios(@CurrentUser() user: any) {
    return this.service.listarServicios(user.establecimientoId);
  }

  @Get()
  @Permissions('establecimientos:leer')
  listar() {
    return this.service.listar();
  }

  @Get('lista/simple')
  @Permissions('establecimientos:leer')
  listarSimplificado() {
    return this.service.listarSimplificado();
  }

  @Get(':id')
  @Permissions('establecimientos:leer')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @Permissions('establecimientos:escribir')
  crear(@Body() dto: CreateEstablecimientoDto) {
    return this.service.crear(dto);
  }

  @Patch(':id')
  @Permissions('establecimientos:escribir')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstablecimientoDto,
  ) {
    return this.service.actualizar(id, dto);
  }

  @Delete(':id')
  @Permissions('establecimientos:eliminar')
  eliminar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.eliminar(id, user.id);
  }
}
