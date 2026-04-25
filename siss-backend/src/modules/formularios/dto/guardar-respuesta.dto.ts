import { IsInt, IsObject, IsBoolean, IsOptional } from 'class-validator';

export class GuardarRespuestaDto {
  @IsInt()
  plantillaId: number;

  @IsObject()
  respuestas: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  completado?: boolean;
}
