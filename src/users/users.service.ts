import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from 'src/prisma.service';
import { FindAllUsersDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneUser(id: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          isActive: 'Y',
        },
      });

      if (!user) {
        throw new RpcException({
          status: 404,
          message: 'User not found',
        });
      }

      return { user };
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

  async findAllUsers(findAllUsersDto: FindAllUsersDto) {
    const {
      id,
      code,
      email,
      userName,
      userShortName,
      isActive,
      isVerified,
      addAttribute1,
      addAttribute2,
      addAttribute3,
      addAttribute4,
      addAttribute5,
      limit,
      offset,
    } = findAllUsersDto;

    try {
      const where: Record<string, unknown> = {};

      if (id) {
        where.id = id;
      }

      if (code) {
        where.code = { contains: code };
      }

      if (email) {
        where.email = { contains: email };
      }

      if (userName) {
        where.userName = { contains: userName };
      }

      if (userShortName) {
        where.userShortName = { contains: userShortName };
      }

      if (isActive) {
        where.isActive = isActive;
      }

      if (isVerified) {
        where.isVerified = isVerified;
      }

      if (addAttribute1) {
        where.addAttribute1 = { contains: addAttribute1 };
      }

      if (addAttribute2) {
        where.addAttribute2 = { contains: addAttribute2 };
      }

      if (addAttribute3) {
        where.addAttribute3 = { contains: addAttribute3 };
      }

      if (addAttribute4) {
        where.addAttribute4 = { contains: addAttribute4 };
      }

      if (addAttribute5) {
        where.addAttribute5 = { contains: addAttribute5 };
      }

      const takeLimit = limit !== undefined ? Number(limit) : undefined;
      const skipOffset = offset !== undefined ? Number(offset) : undefined;

      const users = await this.prisma.user.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        ...(takeLimit !== undefined && !isNaN(takeLimit)
          ? { take: takeLimit }
          : {}),
        ...(skipOffset !== undefined && !isNaN(skipOffset)
          ? { skip: skipOffset }
          : {}),
      });

      return {
        users,
        total: users.length,
      };
    } catch (_error) {
      throw new RpcException({
        status: 500,
        message: 'Internal server error',
      });
    }
  }
}
