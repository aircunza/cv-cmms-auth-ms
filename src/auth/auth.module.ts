import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { NatsModule } from 'src/transports/nats.module';
import { envs } from 'src/config/envs';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  imports: [
    NatsModule,
    JwtModule.register({
      global: true,
      secret: envs.jwtSecret,
      signOptions: { expiresIn: '2h' },
    }),
  ],
})
export class AuthModule {}
