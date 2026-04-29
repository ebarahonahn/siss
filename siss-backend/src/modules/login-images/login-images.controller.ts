import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LoginImagesService } from './login-images.service';
import * as express from 'express';

@Controller('login-images')
export class LoginImagesController {
  constructor(private readonly loginImagesService: LoginImagesService) {}

  @Get()
  findAll() {
    return this.loginImagesService.findAll();
  }

  @Get('management')
  findAllManagement() {
    return this.loginImagesService.findAllManagement();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { nombre: string; titulo?: string; descripcion?: string; orden?: string },
  ) {
    return this.loginImagesService.create({
      nombre: body.nombre,
      titulo: body.titulo,
      descripcion: body.descripcion,
      mimetype: file.mimetype,
      datos: file.buffer,
      orden: body.orden ? parseInt(body.orden) : 0,
    });
  }

  @Get(':id/render')
  async render(@Param('id', ParseIntPipe) id: number, @Res() res: express.Response) {
    const image = await this.loginImagesService.findOne(id);
    if (!image) {
      return res.status(404).send('Image not found');
    }
    res.setHeader('Content-Type', image.mimetype);
    res.send(image.datos);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.loginImagesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.loginImagesService.remove(id);
  }
}
