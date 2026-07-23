import { IsString, IsUUID } from 'class-validator';

export class UserOrgPermissionIdDto {
  @IsString()
  @IsUUID()
  id!: string;
}
