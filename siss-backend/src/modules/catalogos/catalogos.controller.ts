import { Controller, Get, UseGuards } from '@nestjs/common';
import { CatalogosService } from './catalogos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('catalogos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('catalogos:leer')
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @Get()
  async getTodos() {
    return this.catalogosService.obtenerTodos();
  }

  @Get('sexos')
  async getSexos() {
    return this.catalogosService.listarSexos();
  }

  @Get('tipos-sangre')
  async getTiposSangre() {
    return this.catalogosService.listarTiposSangre();
  }

  @Get('escolaridades')
  async getEscolaridades() {
    return this.catalogosService.listarEscolaridades();
  }

  @Get('estados-civiles')
  async getEstadosCiviles() {
    return this.catalogosService.listarEstadosCiviles();
  }

  @Get('ocupaciones')
  async getOcupaciones() {
    return this.catalogosService.listarOcupaciones();
  }

  @Get('tipos-cita')
  async getTiposCita() {
    return this.catalogosService.listarTiposCita();
  }

  @Get('estados-cita')
  async getEstadosCita() {
    return this.catalogosService.listarEstadosCita();
  }
}
