import { Module } from '@nestjs/common';
import { LoginImagesService } from './login-images.service';
import { LoginImagesController } from './login-images.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LoginImagesController],
  providers: [LoginImagesService],
  exports: [LoginImagesService],
})
export class LoginImagesModule {}
