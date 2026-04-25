import { Module } from '@nestjs/common';
import { NotificacionesGateway } from './notificaciones.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [NotificacionesGateway],
  exports: [NotificacionesGateway],
})
export class NotificacionesModule {}
