import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SolicitudesUsuarioService } from './solicitudes-usuario.service';
import { CreateSolicitudUsuarioDto } from './dto/create-solicitud-usuario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EstadoSolicitud } from '@prisma/client';

@Controller('solicitudes-usuario')
export class SolicitudesUsuarioController {
  constructor(private service: SolicitudesUsuarioService) {}

  @Post()
  crear(@Body() dto: CreateSolicitudUsuarioDto) {
    console.log('Recibida solicitud de creación de usuario:', dto);
    return this.service.crear(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('usuarios:gestionar')
  listar(@Query('estado') estado?: EstadoSolicitud) {
    return this.service.listar(estado);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('usuarios:gestionar')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtener(id);
  }

  @Patch(':id/procesar')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('usuarios:gestionar')
  procesar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() data: { estado: EstadoSolicitud; observaciones?: string },
  ) {
    return this.service.procesar(id, user.id, data.estado, data.observaciones);
  }
}
