import { Controller, Post, Body, Get, Param, ParseIntPipe, UseGuards, Res } from '@nestjs/common';
import { PediatriaService } from './pediatria.service';
import { RegistrarControlNiñoSanoDto } from './dto/registrar-control-nino-sano.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as express from 'express';

import { PdfService } from '../../common/services/pdf.service';

@ApiTags('Pediatría')
@Controller('pediatria')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PediatriaController {
  constructor(
    private readonly pediatriaService: PediatriaService,
    private readonly pdfService: PdfService
  ) {}

  @Post('control-nino-sano')
  @ApiOperation({ summary: 'Registrar un nuevo control de niño sano' })
  @Permissions('historia_clinica:crear')
  async registrarControl(@Body() dto: RegistrarControlNiñoSanoDto, @CurrentUser() user: any) {
    console.log('--- LLEGÓ PETICIÓN A REGISTRAR CONTROL PEDIATRICO ---');
    console.log('DTO recibido:', JSON.stringify(dto, null, 2));
    try {
      const res = await this.pediatriaService.registrarControlNiñoSano(dto, user.id);
      console.log('Respuesta del servicio:', res);
      return res;
    } catch (e) {
      console.error('Error en servicio:', e);
      throw e;
    }
  }

  @Get('paciente/:pacienteId/historial-crecimiento')
  @ApiOperation({ summary: 'Obtener historial de crecimiento (Peso, Talla, IMC) del paciente' })
  @Permissions('historia_clinica:leer')
  async getHistorialCrecimiento(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.pediatriaService.getHistorialCrecimiento(pacienteId);
  }

  @Get('paciente/:pacienteId/controles')
  @ApiOperation({ summary: 'Obtener todos los controles de niño sano de un paciente' })
  @Permissions('historia_clinica:leer')
  async getControles(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.pediatriaService.getControlesByPaciente(pacienteId);
  }

  @Get('paciente/:pacienteId/roadmap-vacunas')
  @ApiOperation({ summary: 'Obtener el esquema de vacunación (aplicado vs pendiente) del paciente' })
  @Permissions('historia_clinica:leer')
  async getRoadmap(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.pediatriaService.getRoadmapVacunacion(pacienteId);
  }

  @Get('paciente/:pacienteId/pdf')
  @ApiOperation({ summary: 'Generar PDF del Carnet Pediátrico' })
  @Permissions('historia_clinica:leer')
  async downloadPdf(@Param('pacienteId', ParseIntPipe) pacienteId: number, @Res() res: express.Response) {
    const data = await this.pediatriaService.generarPdfCarnet(pacienteId);
    const stream = await this.pdfService.generarCarnetPediatrico(data.paciente, data.controles, data.roadmap);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=CarnetPediátrico_${pacienteId}.pdf`,
    });
    stream.pipe(res);
  }

  @Get('control/:controlId/pdf')
  @ApiOperation({ summary: 'Generar PDF del detalle de un Control Pediátrico individual' })
  @Permissions('historia_clinica:leer')
  async downloadControlPdf(@Param('controlId', ParseIntPipe) controlId: number, @Res() res: express.Response) {
    const data = await this.pediatriaService.generarPdfControlIndividual(controlId);
    const stream = await this.pdfService.generarNotaControlPediatrico(data.paciente, data.control);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=ConsultaPediatrica_${controlId}.pdf`,
    });
    stream.pipe(res);
  }

  @Post('control/:id/eliminar') // Usamos Post para evitar problemas con algunos proxies o por auditoría si se prefiere, pero el estándar es Delete. 
  // Sin embargo, veo que en otros módulos usan Delete. Usaré Delete.
  @ApiOperation({ summary: 'Eliminar lógicamente un control' })
  @Permissions('historia_clinica:crear') // El que puede crear, suele poder anular su propio error
  async eliminar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.pediatriaService.eliminarControl(id, user.id);
  }
}



