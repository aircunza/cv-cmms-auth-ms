import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UserOrgPermissionsModule } from './user-org-permissions/user-org-permissions.module';

@Module({
  imports: [AuthModule, OrganizationsModule, UserOrgPermissionsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
