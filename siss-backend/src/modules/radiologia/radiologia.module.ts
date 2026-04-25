import { Module } from '@nestjs/common';
import { RadiologiaService } from './radiologia.service';
import { RadiologiaController } from './radiologia.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RadiologiaController],
  providers: [RadiologiaService],
  exports: [RadiologiaService],
})
export class RadiologiaModule {}
