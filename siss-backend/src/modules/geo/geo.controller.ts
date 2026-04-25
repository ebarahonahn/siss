import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { GeoService } from './geo.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('geo')
@UseGuards(JwtAuthGuard)
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('departamentos')
  async getDepartamentos() {
    return this.geoService.listarDepartamentos();
  }

  @Get('departamentos/:id/municipios')
  async getMunicipios(@Param('id', ParseIntPipe) id: number) {
    return this.geoService.listarMunicipiosPorDepto(id);
  }
}
