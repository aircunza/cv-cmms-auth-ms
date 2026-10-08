import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { NatsModule } from 'src/transports/nats.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  imports: [NatsModule],
})
export class UsersModule {}
