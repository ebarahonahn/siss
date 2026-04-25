import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RadiologiaService } from './radiologia.service';
import {
  EstudioRadiologicoDto,
  AsignarEstudiosDto,
  FiltroEstudioDto,
} from './dto/radiologia.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('radiologia')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RadiologiaController {
  constructor(private readonly radiologiaService: RadiologiaService) {}

  @Get('catalogo')
  @Permissions('radiologia:leer')
  listarCatalogo(@Query() filtro: FiltroEstudioDto) {
    return this.radiologiaService.listarCatalogo(filtro);
  }

  @Get('categorias')
  @Permissions('radiologia:leer')
  listarCategorias() {
    return this.radiologiaService.listarCategorias();
  }

  @Post('estudios')
  @Permissions('radiologia:gestionar')
  crear(@Body() dto: EstudioRadiologicoDto) {
    return this.radiologiaService.crearEstudio(dto);
  }

  @Patch('estudios/:id')
  @Permissions('radiologia:gestionar')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EstudioRadiologicoDto,
  ) {
    return this.radiologiaService.actualizarEstudio(id, dto);
  }

  @Post('asignar')
  @Permissions('radiologia:gestionar')
  asignar(@Body() dto: AsignarEstudiosDto) {
    return this.radiologiaService.asignarAEstablecimiento(dto);
  }

  @Get('asignaciones/:establecimientoId')
  @Permissions('radiologia:gestionar')
  obtenerAsignaciones(
    @Param('establecimientoId', ParseIntPipe) establecimientoId: number,
  ) {
    return this.radiologiaService.obtenerAsignaciones(establecimientoId);
  }
}
