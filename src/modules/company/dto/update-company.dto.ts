import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";
import { CreateCompanyDto } from "./create-company.dto";

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}