import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { EstadoEmbarazo } from '@prisma/client';

export class FinalizarEmbarazoDto {
  @IsInt()
  @IsNotEmpty()
  embarazoId: number;

  @IsNotEmpty()
  estado: string;

  @IsString()
  @MinLength(5)
  observaciones: string;

  @IsOptional()
  @IsString()
  fechaTerminacion?: string;
}
