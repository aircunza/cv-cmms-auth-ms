import { IsString, MaxLength } from 'class-validator';

export class ValidateUserCodeDto {
  @IsString()
  @MaxLength(255)
  code!: string;
}
