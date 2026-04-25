import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  EspecialidadesService,
  CreateEspecialidadDto,
} from './especialidades.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('especialidades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EspecialidadesController {
  constructor(private service: EspecialidadesService) {}

  @Get()
  @Permissions('especialidades:leer')
  listar() {
    return this.service.listar();
  }

  @Post()
  @Permissions('especialidades:gestionar')
  crear(@Body() dto: CreateEspecialidadDto, @CurrentUser() user: any) {
    return this.service.crear(dto, user.id);
  }

  @Put(':id')
  @Permissions('especialidades:gestionar')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateEspecialidadDto>,
    @CurrentUser() user: any,
  ) {
    return this.service.actualizar(id, dto, user.id);
  }
}
