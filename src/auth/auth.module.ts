import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [NatsModule],
})
export class AuthModule {}
