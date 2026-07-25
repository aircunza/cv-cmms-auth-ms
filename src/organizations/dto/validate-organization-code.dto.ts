import { IsString, MaxLength } from 'class-validator';

export class ValidateOrganizationCodeDto {
  @IsString()
  @MaxLength(255)
  code!: string;
}
