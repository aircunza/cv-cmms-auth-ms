import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { NatsModule } from 'src/transports/nats.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, PrismaService],
  imports: [NatsModule],
})
export class OrganizationsModule {}
