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
  DefaultValuePipe,
} from '@nestjs/common';
import { MedicamentosService } from './medicamentos.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('medicamentos')
export class MedicamentosController {
  constructor(private svc: MedicamentosService) {}

  @Get('buscar')
  buscar(@Query('q') q: string, @CurrentUser() user?: any) {
    return this.svc.buscar(q ?? '', user?.establecimientoId);
  }

  @Get('establecimiento')
  listarPorEstablecimiento(
    @CurrentUser() user: any,
    @Query('q') busqueda?: string,
  ) {
    return this.svc.listarPorEstablecimiento(user.establecimientoId, busqueda);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('medicamentos:leer,historia_clinica:leer,recetas:leer,hospitalizacion:leer,pediatria:leer,control_prenatal:leer,triaje:leer')
  @Get()
  listar(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query('limite', new DefaultValuePipe(20), ParseIntPipe) limite: number,
    @Query('q') busqueda?: string,
  ) {
    return this.svc.listar(pagina, limite, busqueda);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('medicamentos:leer,historia_clinica:leer,recetas:leer,hospitalizacion:leer,pediatria:leer,control_prenatal:leer,triaje:leer')
  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.svc.obtener(id);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('medicamentos:gestionar')
  @Post()
  crear(@Body() dto: CreateMedicamentoDto, @CurrentUser() user: any) {
    return this.svc.crear(dto, user.id);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('medicamentos:gestionar')
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateMedicamentoDto>,
    @CurrentUser() user: any,
  ) {
    return this.svc.actualizar(id, dto, user.id);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('medicamentos:gestionar')
  @Patch(':id/toggle-activo')
  toggleActivo(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.svc.toggleActivo(id, user.id);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('medicamentos:gestionar')
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.svc.eliminar(id, user.id);
  }
}
