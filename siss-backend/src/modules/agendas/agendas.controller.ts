import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AgendasService } from './agendas.service';
import { CreateAgendaBaseDto } from './dto/create-agenda.dto';
import { CreateExcepcionDto } from './dto/create-excepcion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('agendas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AgendasController {
  constructor(private readonly agendasService: AgendasService) {}

  @Post('base')
  upsertAgendaBase(@Body() dto: CreateAgendaBaseDto) {
    return this.agendasService.upsertAgendaBase(dto);
  }

  @Post('excepciones')
  createExcepcion(@Body() dto: CreateExcepcionDto, @CurrentUser() user: any) {
    return this.agendasService.createExcepcion(dto, user.id);
  }

  @Get('medico/:id/:establecimientoId')
  listarAgendaMedico(
    @Param('id', ParseIntPipe) id: number,
    @Param('establecimientoId', ParseIntPipe) establecimientoId: number,
  ) {
    return this.agendasService.listarAgendaMedico(id, establecimientoId);
  }

  @Get('verificar/:medicoId/:establecimientoId/:fecha')
  verificarDisponibilidad(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Param('establecimientoId', ParseIntPipe) establecimientoId: number,
    @Param('fecha') fecha: string,
  ) {
    return this.agendasService.verificarDisponibilidad(
      medicoId,
      establecimientoId,
      new Date(fecha),
    );
  }

  @Post('excepciones/eliminar/:id')
  eliminarExcepcion(@Param('id', ParseIntPipe) id: number) {
    return this.agendasService.eliminarExcepcion(id);
  }

  @Post('base/eliminar/:medicoId/:establecimientoId/:diaSemana')
  eliminarAgendaBase(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Param('establecimientoId', ParseIntPipe) establecimientoId: number,
    @Param('diaSemana', ParseIntPipe) diaSemana: number,
  ) {
    return this.agendasService.eliminarAgendaBase(medicoId, establecimientoId, diaSemana);
  }
}
