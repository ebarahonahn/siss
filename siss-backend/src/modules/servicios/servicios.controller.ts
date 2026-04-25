import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('servicios')
@UseGuards(JwtAuthGuard)
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Get('catalogo')
  obtenerCatalogo() {
    return this.serviciosService.obtenerCatalogo();
  }

  @Post()
  crear(@Body() dto: CreateServicioDto) {
    return this.serviciosService.crear(dto);
  }

  @Get('establecimiento/:id')
  listarPorEstablecimiento(@Param('id') id: string) {
    return this.serviciosService.listarPorEstablecimiento(+id);
  }

  @Put(':id')
  actualizar(@Param('id') id: string, @Body() data: any) {
    return this.serviciosService.actualizar(+id, data);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.serviciosService.eliminar(+id);
  }
}
