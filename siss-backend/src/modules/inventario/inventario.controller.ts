import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { InventarioService } from './inventario.service';
import {
  AsignarMedicamentoDto,
  ActualizarInventarioDto,
  CargaMasivaInventarioDto,
} from './dto/inventario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventario')
export class InventarioController {
  constructor(private svc: InventarioService) {}

  @Get()
  @Permissions('inventario:leer')
  listar(@CurrentUser() user: any, @Query('q') busqueda?: string) {
    return this.svc.listar(user.establecimientoId, busqueda);
  }

  @Get('admin')
  @Permissions('inventario:gestionar')
  listarTodos(
    @Query('q') busqueda?: string,
    @Query('establecimientoId') establecimientoId?: string,
  ) {
    return this.svc.listarTodos(
      busqueda,
      establecimientoId ? +establecimientoId : undefined,
    );
  }

  @Get('stock-bajo')
  @Permissions('inventario:leer')
  stockBajo(@CurrentUser() user: any) {
    return this.svc.stockBajo(user.establecimientoId);
  }

  @Get(':id')
  @Permissions('inventario:leer')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.svc.obtener(id);
  }

  @Post()
  @Permissions('inventario:gestionar')
  asignar(@Body() dto: AsignarMedicamentoDto, @CurrentUser() user: any) {
    return this.svc.asignar(dto, user.id);
  }

  @Patch(':id')
  @Permissions('inventario:gestionar')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarInventarioDto,
    @CurrentUser() user: any,
  ) {
    return this.svc.actualizar(id, dto, user.id);
  }

  @Get(':id/movimientos')
  @Permissions('inventario:leer')
  listarMovimientos(@Param('id', ParseIntPipe) id: number) {
    return this.svc.listarMovimientos(id);
  }

  @Delete(':id')
  @Permissions('inventario:gestionar')
  eliminar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.svc.eliminar(id, user.id);
  }

  @Post('carga-masiva')
  @Permissions('inventario:gestionar')
  cargaMasiva(@Body() dto: CargaMasivaInventarioDto, @CurrentUser() user: any) {
    return this.svc.cargaMasiva(dto, user.id);
  }
}
