import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LaboratorioService } from './laboratorio.service';
import { AsignarExamenDto, FiltroExamenDto } from './dto/laboratorio.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('laboratorio')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LaboratorioController {
  constructor(private readonly labService: LaboratorioService) {}

  @Get('catalogo')
  @Permissions('laboratorio:leer')
  listarCatalogo(@Query() filtro: FiltroExamenDto) {
    return this.labService.listarCatalogo(filtro);
  }

  @Get('categorias')
  @Permissions('laboratorio:leer')
  listarCategorias() {
    return this.labService.listarCategorias();
  }

  @Get('establecimiento/:id')
  @Permissions('laboratorio:leer')
  listarPorEstablecimiento(@Param('id', ParseIntPipe) id: number) {
    return this.labService.listarPorEstablecimiento(id);
  }

  @Post('asignar')
  @Permissions('laboratorio:gestionar')
  asignarExamenes(@Body() dto: AsignarExamenDto) {
    return this.labService.asignarExamenes(dto);
  }
}
