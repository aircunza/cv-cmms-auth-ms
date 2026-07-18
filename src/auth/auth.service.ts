import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma.service';
import { LoginUserDto, RegisterUserDto } from './dto';

import { JwtPayload } from './interfaces/jwt-payload.interface';
import { envs } from 'src/config';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signJWT(payload: JwtPayload) {
    return this.jwtService.signAsync(payload);
  }

  async verifyToken(token: string) {
    try {
      const user = this.jwtService.verify<JwtPayload>(token, {
        secret: envs.jwtSecret,
      });

      return {
        user,
        token: await this.signJWT(user),
      };
    } catch {
      throw new RpcException({
        status: 401,
        message: 'Invalid token',
      });
    }
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { code, email, userName, userShortName, password } = registerUserDto;

    const id = randomUUID();

    try {
      const userExists = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { code }],
        },
      });

      if (userExists) {
        if (userExists.email === email) {
          throw new RpcException({
            status: 400,
            message: 'The email is already registered',
          });
        }

        if (userExists.code === code) {
          throw new RpcException({
            status: 400,
            message: 'The code is already registered',
          });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          id,
          code,
          email,
          userName,
          userShortName,
          password: hashedPassword,
        },
      });

      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token: await this.signJWT(userWithoutPassword),
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        status: 500,
        message: 'Internal server error',
      });
    }
  }

  health() {
    return {
      status: 'ok',
      message: 'Auth service is running',
    };
  }
}
