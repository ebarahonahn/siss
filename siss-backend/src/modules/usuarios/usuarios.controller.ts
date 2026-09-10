import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  DefaultValuePipe,
  Delete,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('usuarios:gestionar')
export class UsuariosController {
  constructor(private service: UsuariosService) {}

  @Get()
  listar(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query('limite', new DefaultValuePipe(20), ParseIntPipe) limite: number,
    @Query('q') busqueda?: string,
    @CurrentUser() user?: any,
  ) {
    return this.service.listar(
      pagina,
      limite,
      busqueda ?? '',
      user?.establecimientoId,
      user?.rol,
    );
  }

  @Get('medicos-establecimiento')
  @Permissions('citas:leer,citas:crear,hospitalizacion:leer,pediatria:leer,control_prenatal:leer,triaje:leer,pacientes:leer,historia_clinica:leer,usuarios:leer')
  listarMedicos(
    @CurrentUser() user: any,
    @Query('establecimientoId') establecimientoId?: number,
    @Query('especialidadId') especialidadId?: number,
  ) {
    const id = establecimientoId ? Number(establecimientoId) : user.establecimientoId;
    return this.service.listarMedicosPorEstablecimiento(id, especialidadId ? Number(especialidadId) : undefined);
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtener(id);
  }

  @Post('asignaciones')
  agregarAsignacion(
    @Body()
    data: {
      usuarioId: number;
      establecimientoId: number;
      servicioId?: number;
      rolId?: number;
    },
  ) {
    const { usuarioId, ...rest } = data;
    return this.service.agregarAsignacion(usuarioId, rest);
  }

  @Delete('asignaciones/:id')
  quitarAsignacion(@Param('id', ParseIntPipe) id: number) {
    return this.service.quitarAsignacion(id);
  }

  @Patch('asignaciones/:id/permisos')
  actualizarPermisosAsignacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { permisos: string[] },
  ) {
    return this.service.actualizarPermisosAsignacion(id, data.permisos);
  }

  @Post()
  crear(@Body() dto: CrearUsuarioDto, @CurrentUser() user: any) {
    return this.service.crear(dto, user?.establecimientoId);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    return this.service.actualizar(id, dto);
  }

  @Patch(':id/toggle-activo')
  toggleActivo(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleActivo(id);
  }
}
