import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Ingrese su correo o número de empleado' })
  identificador: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  contrasena: string;

  @IsString()
  @IsOptional()
  ip?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsOptional()
  @IsNumber()
  asignacionId?: number;
}
