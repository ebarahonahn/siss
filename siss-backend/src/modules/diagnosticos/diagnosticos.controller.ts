import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DiagnosticosService } from './diagnosticos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('diagnosticos')
export class DiagnosticosController {
  constructor(private svc: DiagnosticosService) {}

  @Get('buscar')
  buscar(@Query('q') q: string) {
    return this.svc.buscar(q ?? '');
  }

  @UseGuards(PermissionsGuard)
  @Permissions('diagnosticos:leer')
  @Get()
  listar(
    @Query('pagina') pagina = '1',
    @Query('limite') limite = '50',
    @Query('busqueda') busqueda?: string,
  ) {
    return this.svc.listar(Number(pagina), Number(limite), busqueda);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('diagnosticos:crear')
  @Post()
  crear(
    @Body() dto: { codigo: string; descripcion: string; capitulo?: string },
  ) {
    return this.svc.crear(dto);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('diagnosticos:crear')
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      codigo?: string;
      descripcion?: string;
      capitulo?: string;
      activo?: boolean;
    },
  ) {
    return this.svc.actualizar(id, dto);
  }
}
