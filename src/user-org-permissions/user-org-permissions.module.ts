import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { NatsModule } from 'src/transports/nats.module';
import { UserOrgPermissionsController } from './user-org-permissions.controller';
import { UserOrgPermissionsService } from './user-org-permissions.service';

@Module({
  controllers: [UserOrgPermissionsController],
  providers: [UserOrgPermissionsService, PrismaService],
  imports: [NatsModule],
})
export class UserOrgPermissionsModule {}
