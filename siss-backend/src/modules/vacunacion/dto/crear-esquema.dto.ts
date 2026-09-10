import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CrearEsquemaDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  numeroDosis: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  edadRecomendadaMeses: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  intervaloMinimoDias?: number;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
