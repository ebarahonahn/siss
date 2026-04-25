import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreatePlantillaDto {
  @IsInt()
  especialidadId: number;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
