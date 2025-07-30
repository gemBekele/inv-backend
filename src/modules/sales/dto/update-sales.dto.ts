import { PartialType } from "@nestjs/swagger";
import { CreateSaleDto } from "./create-sales.dto";

export class UpdateSaleDto extends PartialType(CreateSaleDto) {}