import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from '../../common/services/pdf.service';
import { HospitalizacionService } from './hospitalizacion.service';
import { 
  CreateSalaDto, UpdateSalaDto, 
  CreateHabitacionDto, UpdateHabitacionDto, 
  CreateCamaDto, UpdateCamaDto,
  CreateIngresoDto, CreateEgresoDto, CreateMovimientoDto,
  CreateNotaEvolucionDto, CreateKardexDto, CreateControlSignosDto
} from './dto/hospitalizacion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('hospitalizacion')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HospitalizacionController {
  constructor(
    private readonly svc: HospitalizacionService,
    private readonly pdf: PdfService
  ) {}

  @Get('reporte-notas/:ingresoId')
  @Permissions('hospitalizacion:leer')
  async descargarPdf(@Param('ingresoId', ParseIntPipe) id: number, @Res() res: Response) {
    const ingreso = await this.svc.obtenerIngresoConDetalle(id);
    const notas = await this.svc.listarNotasEvolucion(id);
    
    const doc = await this.pdf.generarNotasEvolucion(ingreso.paciente, ingreso, notas);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=evolucion_${id}.pdf`);
    
    doc.pipe(res);
    doc.end();
  }

  @Get('reporte-kardex/:ingresoId')
  @Permissions('hospitalizacion:leer')
  async descargarKardexPdf(@Param('ingresoId', ParseIntPipe) id: number, @Res() res: Response) {
    const ingreso = await this.svc.obtenerIngresoConDetalle(id);
    const kardex = await this.svc.listarKardex(id);
    const signos = await this.svc.listarSignosVitales(id);
    
    const doc = await this.pdf.generarKardex(ingreso.paciente, ingreso, kardex, signos);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=kardex_${id}.pdf`);
    
    doc.pipe(res);
    doc.end();
  }

  @Get('seguimiento/:ingresoId')
  @Permissions('hospitalizacion:leer')
  listarNotasEvolucion(@Param('ingresoId', ParseIntPipe) ingresoId: number) {
    console.log('Fetching notas for ingreso:', ingresoId);
    return this.svc.listarNotasEvolucion(ingresoId);
  }

  @Get('kardex/:ingresoId')
  @Permissions('hospitalizacion:leer')
  listarKardex(@Param('ingresoId', ParseIntPipe) ingresoId: number) {
    return this.svc.listarKardex(ingresoId);
  }

  @Post('kardex')
  @Permissions('hospitalizacion:gestionar')
  registrarAdministracion(@Body() data: CreateKardexDto) {
    return this.svc.registrarAdministracion(data);
  }

  @Get('signos-vitales/:ingresoId')
  @Permissions('hospitalizacion:leer')
  listarSignosVitales(@Param('ingresoId', ParseIntPipe) ingresoId: number) {
    return this.svc.listarSignosVitales(ingresoId);
  }

  @Post('signos-vitales')
  @Permissions('hospitalizacion:gestionar')
  registrarSignosVitales(@Body() data: CreateControlSignosDto) {
    return this.svc.registrarSignosVitales(data);
  }

  @Get('mapa-camas')
  @Permissions('hospitalizacion:leer')
  obtenerMapaCamas(@CurrentUser() user: any) {
    return this.svc.obtenerMapaCamas(user.establecimientoId);
  }

  @Get('estadisticas')
  @Permissions('hospitalizacion:leer')
  obtenerEstadisticas(@Query('servicioId') servicioId?: string) {
    return this.svc.obtenerEstadisticas(servicioId ? Number(servicioId) : undefined);
  }

  @Post('notas')
  @Permissions('hospitalizacion:gestionar')
  registrarNotaEvolucion(@Body() data: CreateNotaEvolucionDto) {
    return this.svc.registrarNotaEvolucion(data);
  }

  // ── GESTIÓN CLÍNICA (ADMISIÓN, EGRESO, TRASLADOS) ────────────────────────

  @Post('admisiones')
  @Permissions('hospitalizacion:gestionar')
  admitirPaciente(@Body() data: CreateIngresoDto) {
    return this.svc.admitirPaciente(data);
  }

  @Get('ingresos-activos')
  @Permissions('hospitalizacion:leer')
  listarIngresosActivos(@Query('servicioId') servicioId?: string) {
    return this.svc.listarIngresosActivos(servicioId ? Number(servicioId) : undefined);
  }

  @Get('historial-egresos')
  @Permissions('hospitalizacion:leer')
  listarHistorialEgresos(@Query('servicioId') servicioId?: string) {
    return this.svc.listarHistorialEgresos(servicioId ? Number(servicioId) : undefined);
  }

  @Post('egresos')
  @Permissions('hospitalizacion:gestionar')
  registrarEgreso(@Body() data: CreateEgresoDto) {
    return this.svc.registrarEgreso(data);
  }

  @Post('traslados')
  @Permissions('hospitalizacion:gestionar')
  trasladarPaciente(@Body() data: CreateMovimientoDto) {
    return this.svc.trasladarPaciente(data);
  }

  @Get('camas-disponibles')
  @Permissions('hospitalizacion:leer')
  listarCamasDisponibles(@Query('servicioId') servicioId?: string) {
    return this.svc.listarCamasDisponibles(servicioId ? Number(servicioId) : undefined);
  }

  // Catálogos
  @Get('tipos-habitacion')
  listarTiposHabitacion() {
    return this.svc.listarTiposHabitacion();
  }

  @Get('tipos-cama')
  listarTiposCama() {
    return this.svc.listarTiposCama();
  }

  // Salas
  @Get('salas/:servicioId')
  listarSalas(@Param('servicioId', ParseIntPipe) servicioId: number) {
    return this.svc.listarSalas(servicioId);
  }

  @Post('salas')
  crearSala(@Body() data: CreateSalaDto) {
    return this.svc.crearSala(data);
  }

  @Patch('salas/:id')
  actualizarSala(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateSalaDto) {
    return this.svc.actualizarSala(id, data);
  }

  @Delete('salas/:id')
  eliminarSala(@Param('id', ParseIntPipe) id: number) {
    return this.svc.eliminarSala(id);
  }

  // Habitaciones
  @Get('habitaciones/:salaId')
  listarHabitaciones(@Param('salaId', ParseIntPipe) salaId: number) {
    return this.svc.listarHabitaciones(salaId);
  }

  @Post('habitaciones')
  crearHabitacion(@Body() data: CreateHabitacionDto) {
    return this.svc.crearHabitacion(data);
  }

  @Patch('habitaciones/:id')
  actualizarHabitacion(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateHabitacionDto) {
    return this.svc.actualizarHabitacion(id, data);
  }

  @Delete('habitaciones/:id')
  eliminarHabitacion(@Param('id', ParseIntPipe) id: number) {
    return this.svc.eliminarHabitacion(id);
  }

  // Camas
  @Get('camas/:habitacionId')
  listarCamas(@Param('habitacionId', ParseIntPipe) habitacionId: number) {
    return this.svc.listarCamas(habitacionId);
  }

  @Post('camas')
  crearCama(@Body() data: CreateCamaDto) {
    return this.svc.crearCama(data);
  }

  @Patch('camas/:id')
  actualizarCama(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateCamaDto) {
    return this.svc.actualizarCama(id, data);
  }

  @Delete('camas/:id')
  eliminarCama(@Param('id', ParseIntPipe) id: number) {
    return this.svc.eliminarCama(id);
  }

  @Post('camas/:id/liberar')
  @Permissions('hospitalizacion:gestionar')
  liberarCama(@Param('id', ParseIntPipe) id: number) {
    return this.svc.liberarCama(id);
  }
}
