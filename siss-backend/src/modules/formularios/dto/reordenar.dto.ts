import { IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class ItemOrden {
  @IsInt()
  id: number;

  @IsInt()
  orden: number;
}

export class ReordenarDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemOrden)
  items: ItemOrden[];
}
