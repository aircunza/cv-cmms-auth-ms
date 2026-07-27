import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { NatsModule } from 'src/transports/nats.module';
import { OrganizationEventsService } from './organization-events.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, PrismaService, OrganizationEventsService],
  imports: [NatsModule],
})
export class OrganizationsModule {}
