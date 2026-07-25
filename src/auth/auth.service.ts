import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma.service';
import { LoginUserDto, RegisterUserDto } from './dto';

import { JwtPayload, JwtPayloadRaw } from './interfaces/jwt-payload.interface';
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

  verifyToken(token: string) {
    try {
      const rawUser = this.jwtService.verify<JwtPayloadRaw>(token, {
        secret: envs.jwtSecret,
      });

      const { iat: _iat, exp: _exp, ...user } = rawUser;

      return {
        user: user,
        token: token, // if you want sent a new token -> await this.signJWT(user)
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      throw new RpcException({
        status: 401,
        message: 'Invalid token',
      });
    }
  }

  logoutUser(token: string) {
    try {
      this.jwtService.verify<JwtPayloadRaw>(token, {
        secret: envs.jwtSecret,
      });

      return {
        status: 'ok',
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Error logging out token:', error);
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

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, code, password } = loginUserDto;

    const hasEmail = Boolean(email);
    const hasCode = Boolean(code);

    try {
      if ((hasEmail && hasCode) || (!hasEmail && !hasCode)) {
        throw new RpcException({
          status: 400,
          message: 'Provide exactly one identifier: email or code',
        });
      }

      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            ...(hasEmail ? [{ email: email! }] : []),
            ...(hasCode ? [{ code: code! }] : []),
          ],
        },
      });

      if (!user) {
        throw new RpcException({
          status: 400,
          message: 'User/Password not valid',
        });
      }

      const passwordValid = await bcrypt.compare(password, user.password);

      if (!passwordValid) {
        throw new RpcException({
          status: 400,
          message: 'User/Password not valid',
        });
      }

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

  async validateUserByCode(code: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          code,
          OR: [{ isActive: 'Y' }, { isActive: null }],
        },
      });

      if (!user) {
        throw new RpcException({
          status: 404,
          message: 'User not found',
        });
      }

      const { password: _password, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
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
