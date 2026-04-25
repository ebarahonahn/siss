import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateServicioDto {
  @IsNotEmpty()
  @IsNumber()
  catServicioId: number;

  @IsNotEmpty()
  @IsNumber()
  establecimientoId: number;
}
