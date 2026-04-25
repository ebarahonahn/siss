import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { EpidemiologiaService } from './epidemiologia.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('epidemiologia')
@UseGuards(JwtAuthGuard)
export class EpidemiologiaController {
  constructor(private readonly epidemiologiaService: EpidemiologiaService) {}

  @Post('notificar')
  async notificar(@Body() dto: any, @CurrentUser() user: any) {
    return this.epidemiologiaService.crearNotificacion(dto, user.id);
  }

  @Get('historia/:id')
  async obtenerPorHistoria(@Param('id', ParseIntPipe) historiaId: number) {
    return this.epidemiologiaService.obtenerPorHistoria(historiaId);
  }

  @Get('listado')
  async listar(@Query('establecimientoId') establecimientoId?: number) {
    return this.epidemiologiaService.listarNotificaciones(
      establecimientoId ? Number(establecimientoId) : undefined,
    );
  }

  @Get('dashboard/mapa-calor')
  async obtenerMapaCalor() {
    return this.epidemiologiaService.obtenerMapaCalor();
  }

  @Get('dashboard/canal-endemico')
  async obtenerCanalEndemico(@Query('anio') anio?: number) {
    return this.epidemiologiaService.obtenerCanalEndemico(anio ? Number(anio) : undefined);
  }

  @Get('dashboard/alertas')
  async obtenerAlertasTiempo() {
    return this.epidemiologiaService.obtenerAlertasTiempo();
  }

  @Post(':id/gestionar')
  async gestionar(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
    @CurrentUser() user: any,
  ) {
    return this.epidemiologiaService.gestionarNotificacion(id, estado, user.id);
  }
}
