import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReferenciasService } from './referencias.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('referencias')
@UseGuards(JwtAuthGuard)
export class ReferenciasController {
  constructor(private readonly referenciasService: ReferenciasService) {}

  @Post()
  async crear(@Body() data: any) {
    return await this.referenciasService.crear(data);
  }

  @Get('paciente/:id')
  async obtenerPorPaciente(@Param('id') id: string) {
    return await this.referenciasService.obtenerPorPaciente(parseInt(id));
  }

  @Get('historia/:id')
  async obtenerPorHistoria(@Param('id') id: string) {
    return await this.referenciasService.obtenerPorHistoria(parseInt(id));
  }
}
