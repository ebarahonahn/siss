import { IsString, IsOptional, IsObject } from 'class-validator';

export class ActualizarRolDto {
  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsObject()
  permisos?: Record<string, string[] | boolean>;
}
