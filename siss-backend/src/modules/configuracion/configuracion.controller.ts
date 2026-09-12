import {
  Controller,
  Get,
  Put,
  Param,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfiguracionService } from './configuracion.service';
import * as express from 'express';
import { CreateConfiguracionDocumentoDto } from './dto/create-configuracion-documento.dto';
import { UpdateConfiguracionDocumentoDto } from './dto/update-configuracion-documento.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly configService: ConfiguracionService) {}

  @Get()
  getConfig() {
    return this.configService.getConfig();
  }

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @UploadedFile() file: any,
    @Body() body: { siglasSistema?: string; nombreSistema?: string },
  ) {
    return this.configService.update({
      siglasSistema: body.siglasSistema,
      nombreSistema: body.nombreSistema,
      logo: file?.buffer,
      logoMimetype: file?.mimetype,
    });
  }

  @Get('documentos')
  listarConfiguracionesDocumento() {
    return this.configService.listarConfiguracionesDocumento();
  }

  @Post('documentos')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('configuracion:gestionar')
  crearConfiguracionDocumento(@Body() data: CreateConfiguracionDocumentoDto) {
    return this.configService.crearConfiguracionDocumento(data);
  }

  @Get('documentos/:codigo')
  obtenerConfiguracionDocumento(@Param('codigo') codigo: string) {
    return this.configService.obtenerConfiguracionDocumento(codigo);
  }

  @Put('documentos/:codigo')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('configuracion:gestionar')
  actualizarConfiguracionDocumento(
    @Param('codigo') codigo: string,
    @Body() data: UpdateConfiguracionDocumentoDto,
  ) {
    return this.configService.actualizarConfiguracionDocumento(codigo, data);
  }

  @Get('logo')
  async renderLogo(@Res() res: express.Response) {
    const config = await this.configService.findOne();
    if (!config || !config.logo) {
      return res.status(404).send('Logo not found');
    }
    res.setHeader('Content-Type', config.logoMimetype || 'image/png');
    res.send(config.logo);
  }
}
