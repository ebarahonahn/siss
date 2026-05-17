import { Controller, Post, Patch, Body, Get, Param, Query, ParseIntPipe, UseGuards, NotFoundException } from '@nestjs/common';
import { ControlPrenatalService } from './control-prenatal.service';
import { ControlPrenatalExportService } from './control-prenatal-export.service';
import { CaptacionEmbarazoDto } from './dto/captacion-embarazo.dto';
import { RegistrarControlDto } from './dto/registrar-control.dto';
import { FinalizarEmbarazoDto } from './dto/finalizar-embarazo.dto';
import { ActualizarEmbarazoDto } from './dto/actualizar-embarazo.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PdfService } from '../../common/services/pdf.service';
import { Res } from '@nestjs/common';

@ApiTags('Control Prenatal')
@Controller('control-prenatal')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ControlPrenatalController {
  constructor(
    private readonly controlService: ControlPrenatalService,
    private readonly exportService: ControlPrenatalExportService,
    private readonly pdf: PdfService
  ) {}

  @Get('mi-seguimiento/activo')
  @ApiOperation({ summary: 'Obtener el embarazo activo del usuario actual (paciente)' })
  async getMiEmbarazo(@CurrentUser() user: any) {
    console.log(`[PRENATAL] Buscando embarazo para usuario: ${user.correo} (pacienteId: ${user.pacienteId})`);
    
    if (user.userType === 'PACIENTE' && user.pacienteId) {
      const res = await this.controlService.getEmbarazoActivo(user.pacienteId);
      console.log(`[PRENATAL] Resultado para pacienteId ${user.pacienteId}: ${res ? 'Encontrado' : 'No encontrado'}`);
      return res;
    }
    
    const paciente = await this.controlService.getPacienteByDni(user.dni);
    if (!paciente) {
      throw new NotFoundException('Perfil de paciente no encontrado');
    }
    return this.controlService.getEmbarazoActivo(paciente.id);
  }

  @Post('captacion')
  @ApiOperation({ summary: 'Iniciar el seguimiento de un embarazo (Captación)' })
  @Permissions('control_prenatal:escribir')
  async captarEmbarazo(@Body() dto: CaptacionEmbarazoDto, @CurrentUser() user: any) {
    return this.controlService.captarEmbarazo(dto, user.id);
  }

  @Post('control')
  @ApiOperation({ summary: 'Registrar un control prenatal periódico' })
  @Permissions('control_prenatal:escribir')
  async registrarControl(@Body() dto: RegistrarControlDto, @CurrentUser() user: any) {
    return this.controlService.registrarControl(dto, user.id);
  }

  @Get('paciente/:pacienteId/activo')
  @ApiOperation({ summary: 'Obtener el embarazo activo de una paciente' })
  @Permissions('control_prenatal:leer')
  async getEmbarazoActivo(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.controlService.getEmbarazoActivo(pacienteId);
  }

  @Get('paciente/:pacienteId/historial')
  @ApiOperation({ summary: 'Obtener el historial de todos los embarazos de una paciente' })
  @Permissions('control_prenatal:leer')
  async getHistorial(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.controlService.getHistorialEmbarazos(pacienteId);
  }

  @Get('export/:embarazoId/sip')
  @ApiOperation({ summary: 'Exportar datos en formato compatible con SIP Plus' })
  @Permissions('control_prenatal:leer')
  async exportarSip(@Param('embarazoId', ParseIntPipe) embarazoId: number) {
    return this.exportService.exportarSipPlus(embarazoId);
  }

  @Get('lista/activos')
  @ApiOperation({ summary: 'Listar todos los embarazos activos del establecimiento' })
  @Permissions('control_prenatal:leer')
  async listarActivos() {
    return this.controlService.listarTodosActivos();
  }

  @Get('buscar')
  @ApiOperation({ summary: 'Buscar embarazos activos por nombre o DNI' })
  @Permissions('control_prenatal:leer')
  async buscar(@Query('q') q: string) {
    return this.controlService.buscarActivos(q);
  }

  @Get('export/:embarazoId/pdf')
  @ApiOperation({ summary: 'Generar el PDF oficial de la Ficha Perinatal (HCPB)' })
  @Permissions('control_prenatal:leer')
  async exportarPdf(@Param('embarazoId', ParseIntPipe) embarazoId: number, @Res() res: any) {
    try {
      const embarazo = await this.controlService.getEmbarazoById(embarazoId);
      
      if (!embarazo) {
        return res.status(404).json({ message: 'Embarazo no encontrado' });
      }

      console.log('[PDF-DEBUG] Embarazo data:', JSON.stringify(embarazo, null, 2));

      const stream = await this.pdf.generarFichaPerinatal(embarazo);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=HCPB_${embarazo.paciente?.dni || 'sin_dni'}.pdf`,
      });

      stream.pipe(res);
    } catch (err) {
      console.error('[PDF-ERROR] Error al generar PDF:', err?.message || err);
      console.error('[PDF-ERROR] Stack:', err?.stack);
      return res.status(500).json({ message: 'Error al generar PDF', detail: err?.message });
    }
  }

  @Get('control/:controlId/pdf')
  @ApiOperation({ summary: 'Generar el PDF de una consulta/control prenatal individual' })
  @Permissions('control_prenatal:leer')
  async exportarControlPdf(@Param('controlId', ParseIntPipe) controlId: number, @Res() res: any) {
    try {
      const control = await this.controlService.getControlDetalle(controlId);
      if (!control) {
        return res.status(404).json({ message: 'Control prenatal no encontrado' });
      }

      if (!control.historiaClinicaId) {
        return res.status(404).json({ message: 'El control prenatal no tiene una nota clínica asociada' });
      }

      const historia = await this.controlService.getHistoriaDetalleParaControl(control.historiaClinicaId);
      if (!historia) {
        return res.status(404).json({ message: 'Nota de historia clínica no encontrada' });
      }

      const stream = await this.pdf.generarNotaControlPrenatal(control.embarazo, control, historia);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=ControlPrenatal_${controlId}.pdf`,
      });

      stream.pipe(res);
    } catch (err) {
      console.error('[PDF-ERROR] Error al generar PDF de control prenatal:', err?.message || err);
      return res.status(500).json({ message: 'Error al generar PDF de control prenatal', detail: err?.message });
    }
  }
  
  @Post('finalizar')
  @ApiOperation({ summary: 'Finalizar un embarazo (Parto, Aborto, etc.)' })
  @Permissions('control_prenatal:escribir')
  async finalizarEmbarazo(@Body() dto: FinalizarEmbarazoDto, @CurrentUser() user: any) {
    return this.controlService.finalizarEmbarazo(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un embarazo específico por su ID' })
  @Permissions('control_prenatal:leer')
  async getEmbarazoById(@Param('id', ParseIntPipe) id: number) {
    return this.controlService.getEmbarazoById(id);
  }

  @Patch(':id/gestacion')
  @ApiOperation({ summary: 'Actualizar datos de gestación (cantidad de fetos)' })
  @Permissions('control_prenatal:escribir')
  async actualizarGestacion(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarEmbarazoDto, @CurrentUser() user: any) {
    return this.controlService.actualizarEmbarazo(id, dto, user.id);
  }
}
