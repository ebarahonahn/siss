import { IsNumber, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class DispensacionDetalleDto {
  @IsNumber() @IsNotEmpty() detalleRecetaId: number;
  @IsNumber() @IsNotEmpty() cantidad: number;
}

export class CreateDispensacionDto {
  @IsNumber() @IsNotEmpty() recetaId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispensacionDetalleDto)
  detalles: DispensacionDetalleDto[];
}
