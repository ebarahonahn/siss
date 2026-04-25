import { Module } from '@nestjs/common';
import { EpidemiologiaService } from './epidemiologia.service';
import { EpidemiologiaController } from './epidemiologia.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EpidemiologiaService],
  controllers: [EpidemiologiaController],
})
export class EpidemiologiaModule {}
