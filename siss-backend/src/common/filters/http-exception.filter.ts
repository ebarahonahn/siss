import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      switch (exception.code) {
        case 'P2002':
          const fields = (exception.meta?.target as string[]) || [];
          message = `Ya existe un registro con ese valor: ${fields.join(', ')}`;
          break;
        case 'P2020':
          message = `Valor fuera de rango: ${exception.meta?.details || 'Dato no válido'}`;
          break;
        case 'P2025':
          message = 'No se encontró el registro solicitado';
          break;
        default:
          message = `Error de base de datos: ${exception.code}`;
          break;
      }
    } else if (exception instanceof Error) {
      console.error('Error no controlado:', exception.message);
    }

    console.error('--- EXCEPCIÓN DETECTADA ---');
    console.error('Status:', status);
    console.error('Message:', JSON.stringify(message, null, 2));
    console.error('Exception Code:', (exception as any)?.code);
    console.error('---------------------------');

    response.status(status).json({
      ok: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof message === 'object' && 'message' in message
          ? (message as any).message
          : message,
    });
  }
}
