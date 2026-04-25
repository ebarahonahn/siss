import { Module } from '@nestjs/common';
import { TriajeController } from './triaje.controller';
import { TriajeService } from './triaje.service';

@Module({
  controllers: [TriajeController],
  providers: [TriajeService],
  exports: [TriajeService],
})
export class TriajeModule {}
