import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfiguracionService } from './configuracion.service';
import * as express from 'express';

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
