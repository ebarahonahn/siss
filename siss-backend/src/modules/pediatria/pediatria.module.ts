import { Module } from '@nestjs/common';
import { PediatriaController } from './pediatria.controller';
import { PediatriaService } from './pediatria.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PdfService } from '../../common/services/pdf.service';

@Module({
  imports: [PrismaModule],
  controllers: [PediatriaController],
  providers: [PediatriaService, PdfService],
  exports: [PediatriaService],
})
export class PediatriaModule {}
