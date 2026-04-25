import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/notificaciones',
})
export class NotificacionesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private conectados = new Map<number, string>();

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token as string;
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      socket.join(`usuario:${payload.sub}`);
      socket.join(`rol:${payload.rol}`);
      socket.join(`establecimiento:${payload.establecimientoId}`);

      this.conectados.set(payload.sub, socket.id);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    for (const [uid, sid] of this.conectados) {
      if (sid === socket.id) {
        this.conectados.delete(uid);
        break;
      }
    }
  }

  notificarLlegadaPaciente(
    medicoId: number,
    datos: { paciente: string; citaId: number },
  ) {
    this.server.to(`usuario:${medicoId}`).emit('paciente:llegada', datos);
  }

  alertaStockBajo(
    establecimientoId: number,
    datos: { medicamento: string; cantidad: number },
  ) {
    this.server
      .to(`rol:FARMACEUTICO`)
      .to(`establecimiento:${establecimientoId}`)
      .emit('farmacia:stock_bajo', datos);
  }

  resultadoLaboratorioListo(
    medicoId: number,
    datos: { paciente: string; prueba: string },
  ) {
    this.server.to(`usuario:${medicoId}`).emit('laboratorio:resultado', datos);
  }

  alertaEpidemiologica(datos: {
    enfermedad: string;
    municipio: string;
    casos: number;
  }) {
    this.server
      .to('rol:MEDICO')
      .to('rol:EPIDEMIOLOGO')
      .emit('epidemiologia:alerta', datos);
  }
}
