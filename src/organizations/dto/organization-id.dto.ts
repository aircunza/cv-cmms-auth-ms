import { IsString, IsUUID } from 'class-validator';

export class OrganizationIdDto {
  @IsString()
  @IsUUID()
  id!: string;
}
