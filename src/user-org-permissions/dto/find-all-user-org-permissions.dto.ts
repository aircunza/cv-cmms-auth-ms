import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

export class FindAllUserOrgPermissionsDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  roleCode?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[YN]$/)
  isActive?: string;
}
