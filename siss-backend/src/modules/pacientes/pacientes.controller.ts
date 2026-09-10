import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PacientesService } from './pacientes.service';
import { RnpService } from './rnp.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Pacientes')
@ApiBearerAuth()
@Controller('pacientes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PacientesController {
  constructor(
    private pacientesService: PacientesService,
    private rnpService: RnpService,
  ) {}

  @ApiOperation({ summary: 'Validar DNI con el RNP', description: 'Consulta el servicio del RNP para validar la existencia de un ciudadano.' })
  @ApiResponse({ status: 200, description: 'Ciudadano encontrado' })
  @ApiResponse({ status: 404, description: 'Ciudadano no encontrado' })
  @Get('validar-rnp/:dni')
  @Permissions('pacientes:leer')
  validarRnp(@Param('dni') dni: string) {
    return this.rnpService.validarDni(dni);
  }

  @Post()
  @Permissions('pacientes:crear')
  crear(@Body() dto: CreatePacienteDto, @CurrentUser() user: any) {
    return this.pacientesService.crear(dto, user.id, user.establecimientoId);
  }

  @Get('mi-perfil')
  @Permissions('pacientes:leer')
  async obtenerMiPerfil(@CurrentUser() user: any) {
    console.log(`[PACIENTES] Mi perfil solicitado por: ${user?.correo} | DNI: ${user?.dni} | Rol: ${user?.rol}`);
    if (!user?.dni) {
      console.error('[PACIENTES] ERROR: El usuario no tiene DNI en el token');
    }
    const perfil = await this.pacientesService.obtenerPerfilPorDni(user.dni);
    console.log(`[PACIENTES] Perfil obtenido para ${user.dni}. Historial: ${perfil?.historialClinico?.length || 0} | Recetas: ${perfil?.recetas?.length || 0}`);
    return perfil;
  }

  @Get('buscar')
  @Permissions('pacientes:leer,historia_clinica:leer,historial_unificado:leer,pediatria:leer,control_prenatal:leer,triaje:leer,hospitalizacion:leer,vacunacion:leer,citas:leer')
  buscar(
    @Query('q') termino: string,
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query('limite', new DefaultValuePipe(20), ParseIntPipe) limite: number,
    @Query('sexoId') sexoId: string, // Add this
    @CurrentUser() user: any,
  ) {
    return this.pacientesService.buscar(
      termino ?? '',
      pagina,
      limite,
      user.establecimientoId,
      user.rol,
      sexoId ? parseInt(sexoId) : undefined
    );
  }

  @Get(':id')
  @Permissions('pacientes:leer,historia_clinica:leer,historial_unificado:leer,pediatria:leer,control_prenatal:leer,triaje:leer,hospitalizacion:leer,vacunacion:leer,citas:leer')
  obtenerPerfil(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.obtenerPerfil(id);
  }

  @Put(':id')
  @Permissions('pacientes:editar')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreatePacienteDto>,
    @CurrentUser() user: any,
  ) {
    return this.pacientesService.actualizar(
      id,
      dto,
      user.id,
      user.establecimientoId,
    );
  }

  @Post(':id/eliminar')
  @Permissions('pacientes:eliminar')
  eliminar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.pacientesService.eliminar(id, user.id, user.establecimientoId);
  }
}
