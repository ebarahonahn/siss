import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ParametrosService } from './parametros.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('parametros')
@UseGuards(JwtAuthGuard)
export class ParametrosController {
  constructor(private readonly service: ParametrosService) {}

  @Get()
  listar() {
    return this.service.listarTodos();
  }

  @Get(':clave')
  obtener(@Param('clave') clave: string) {
    return this.service.obtenerPorClave(clave);
  }
}
