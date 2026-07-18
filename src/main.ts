import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { envs } from './config';

async function bootstrap() {
  const logger = new Logger('Main');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: envs.natsServers,
        user: envs.natsUser,
        pass: envs.natsPass,
        // tls: {
        //   ca: [readFileSync(envs.natsCaPath)],
        //   rejectUnauthorized: true,
        //   servername: envs.natsServerName,
        // },
        maxReconnectAttempts: 10,
        reconnectTimeWait: 2000,
        timeout: 5000,
        pingInterval: 10000,
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen();
  logger.log(`Products Microservice running on port ${envs.port}`);
}
bootstrap();
