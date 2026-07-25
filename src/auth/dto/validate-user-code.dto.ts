import { IsString, MaxLength } from 'class-validator';

export class ValidateUserCodeDto {
  @IsString()
  @MaxLength(12)
  code!: string;
}
