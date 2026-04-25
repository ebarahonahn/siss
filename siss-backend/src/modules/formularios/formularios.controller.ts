import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';
import { FormulariosService } from './formularios.service';
import { CreatePlantillaDto } from './dto/create-plantilla.dto';
import { CreateSeccionDto } from './dto/create-seccion.dto';
import { CreateCampoDto } from './dto/create-campo.dto';
import { ReordenarDto } from './dto/reordenar.dto';
import { GuardarRespuestaDto } from './dto/guardar-respuesta.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('formularios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FormulariosController {
  constructor(private service: FormulariosService) {}

  @Post('plantillas')
  @Permissions('formularios:gestionar')
  crearPlantilla(@Body() dto: CreatePlantillaDto, @CurrentUser() user: any) {
    return this.service.crearPlantilla(dto, user.id);
  }

  @Get('plantillas')
  @Permissions('formularios:leer')
  listarPlantillas(
    @Query('especialidadId', new DefaultValuePipe(0), ParseIntPipe) esp: number,
  ) {
    return this.service.listarPlantillas(esp || undefined);
  }

  @Get('plantillas/:id')
  @Permissions('formularios:leer')
  obtenerPlantilla(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPlantilla(id);
  }

  @Get('plantillas/especialidad/:espId/activa')
  @Permissions('formularios:leer')
  obtenerActiva(@Param('espId', ParseIntPipe) espId: number) {
    return this.service.obtenerPlantillaActivaPorEspecialidad(espId);
  }

  @Patch('plantillas/:id/activar')
  @Permissions('formularios:gestionar')
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.service.activarPlantilla(id);
  }

  @Post('plantillas/:id/duplicar')
  @Permissions('formularios:gestionar')
  duplicar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.duplicarPlantilla(id, user.id);
  }

  @Delete('plantillas/:id')
  @Permissions('formularios:gestionar')
  eliminarPlantilla(@Param('id', ParseIntPipe) id: number) {
    return this.service.eliminarPlantilla(id);
  }

  @Put('plantillas/:id')
  @Permissions('formularios:gestionar')
  actualizarPlantilla(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreatePlantillaDto>,
  ) {
    return this.service.actualizarPlantilla(id, dto);
  }

  @Post('secciones')
  @Permissions('formularios:gestionar')
  crearSeccion(@Body() dto: CreateSeccionDto) {
    return this.service.crearSeccion(dto);
  }

  @Put('secciones/:id')
  @Permissions('formularios:gestionar')
  actualizarSeccion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateSeccionDto>,
  ) {
    return this.service.actualizarSeccion(id, dto);
  }

  @Delete('secciones/:id')
  @Permissions('formularios:gestionar')
  eliminarSeccion(@Param('id', ParseIntPipe) id: number) {
    return this.service.eliminarSeccion(id);
  }

  @Put('secciones/reordenar')
  @Permissions('formularios:gestionar')
  reordenarSecciones(@Body() dto: ReordenarDto) {
    return this.service.reordenarSecciones(dto.items);
  }

  @Post('campos')
  @Permissions('formularios:gestionar')
  crearCampo(@Body() dto: CreateCampoDto) {
    return this.service.crearCampo(dto);
  }

  @Put('campos/:id')
  @Permissions('formularios:gestionar')
  actualizarCampo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCampoDto>,
  ) {
    return this.service.actualizarCampo(id, dto);
  }

  @Delete('campos/:id')
  @Permissions('formularios:gestionar')
  eliminarCampo(@Param('id', ParseIntPipe) id: number) {
    return this.service.eliminarCampo(id);
  }

  @Put('campos/reordenar')
  @Permissions('formularios:gestionar')
  reordenarCampos(@Body() dto: ReordenarDto) {
    return this.service.reordenarCampos(dto.items);
  }

  @Post('respuestas/:historiaId')
  @Permissions('formularios:llenar')
  guardarRespuesta(
    @Param('historiaId', ParseIntPipe) historiaId: number,
    @Body() dto: GuardarRespuestaDto,
  ) {
    return this.service.guardarRespuesta(
      historiaId,
      dto.plantillaId,
      dto.respuestas,
      dto.completado,
    );
  }

  @Get('respuestas/:historiaId')
  @Permissions('formularios:leer')
  obtenerRespuesta(@Param('historiaId', ParseIntPipe) historiaId: number) {
    return this.service.obtenerRespuesta(historiaId);
  }
}
