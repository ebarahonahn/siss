import { Module } from '@nestjs/common';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';
import { RnpService } from './rnp.service';

@Module({
  controllers: [PacientesController],
  providers: [PacientesService, RnpService],
  exports: [PacientesService, RnpService],
})
export class PacientesModule {}
