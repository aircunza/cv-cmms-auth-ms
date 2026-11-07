import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { LoginUserDto, RegisterUserDto, RegisterUserWithRoleDto } from './dto';

import { JwtPayload, JwtPayloadRaw } from './interfaces/jwt-payload.interface';
import {
  OrganizationRole,
  Role,
} from './interfaces/organization-role.interface';
import { envs } from 'src/config';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private parsePermissions(value: string | null): string[] | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) return null;
      return parsed.filter((item) => typeof item === 'string');
    } catch {
      return null;
    }
  }

  async getUserOrganizations(userId: string): Promise<OrganizationRole[]> {
    const userOrgPermissions = await this.prisma.userOrgPermission.findMany({
      where: {
        userId,
        isActive: 'Y',
      },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const orgMap = new Map<string, OrganizationRole>();

    for (const perm of userOrgPermissions) {
      const org = perm.organization;
      const existing = orgMap.get(org.id);

      const role: Role = {
        roleCode: perm.roleCode,
        roleName: perm.roleName,
        roleDescription: perm.roleDescription,
        permissions: this.parsePermissions(perm.permissions) ?? [],
        deniedPermissions: this.parsePermissions(perm.deniedPermissions),
      };

      if (existing) {
        existing.roles.push(role);
      } else {
        orgMap.set(org.id, {
          organizationId: org.id,
          organizationCode: org.code,
          organizationName: org.name,
          countryCode: org.countryCode,
          countryName: org.countryName,
          timezone: org.timezone,
          roles: [role],
        });
      }
    }

    return Array.from(orgMap.values());
  }

  async signJWT(payload: JwtPayload) {
    return this.jwtService.signAsync(payload);
  }

  async verifyToken(token: string) {
    try {
      const rawUser = this.jwtService.verify<JwtPayloadRaw>(token, {
        secret: envs.jwtSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: rawUser.id },
      });

      if (!user) {
        throw new RpcException({
          status: 401,
          message: 'Invalid token',
        });
      }

      const { password: _password, ...userWithoutPassword } = user;

      const organizations = await this.getUserOrganizations(user.id);

      return {
        user: userWithoutPassword,
        organizations,
        auth_token: token,
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
        auth_token: await this.signJWT({ id: user.id }),
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

  async registerUserWithRole(dto: RegisterUserWithRoleDto) {
    const {
      requesterId,
      organizationId,
      code,
      email,
      userName,
      userShortName,
      password,
      roleCode,
      roleName,
      roleDescription,
      permissions,
      deniedPermissions,
      assignedAt,
    } = dto;

    try {
      const requesterIsAdmin = await this.prisma.userOrgPermission.findFirst({
        where: {
          userId: requesterId,
          organizationId,
          roleCode: 'ADMIN',
          isActive: 'Y',
        },
      });

      if (!requesterIsAdmin) {
        throw new RpcException({
          status: 403,
          message:
            'Only users with role ADMIN in this organization can register users with roles',
        });
      }

      const organization = await this.prisma.organization.findFirst({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new RpcException({
          status: 404,
          message: 'Organization not found',
        });
      }

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
      const now = new Date();

      // Usuario y rol se crean en una sola transaccion: si falla alguno, no queda nada a medias.
      const { user, permission } = await this.prisma.$transaction(
        async (tx) => {
          const createdUser = await tx.user.create({
            data: {
              id: randomUUID(),
              code,
              email,
              userName,
              userShortName,
              password: hashedPassword,
              isActive: dto.isActive,
              isVerified: dto.isVerified,
              addAttribute1: dto.addAttribute1,
              addAttribute2: dto.addAttribute2,
              addAttribute3: dto.addAttribute3,
              addAttribute4: dto.addAttribute4,
              addAttribute5: dto.addAttribute5,
              updatedAt: now,
            },
          });

          const createdPermission = await tx.userOrgPermission.create({
            data: {
              id: randomUUID(),
              userId: createdUser.id,
              organizationId,
              roleCode,
              roleName,
              roleDescription,
              permissions: JSON.stringify(permissions),
              deniedPermissions: deniedPermissions
                ? JSON.stringify(deniedPermissions)
                : null,
              isActive: dto.permissionIsActive ?? 'Y',
              assignedAt: assignedAt ? new Date(assignedAt) : now,
              updatedAt: now,
            },
          });

          return { user: createdUser, permission: createdPermission };
        },
      );

      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        userOrgPermission: {
          id: permission.id,
          userId: permission.userId,
          organizationId: permission.organizationId,
          roleCode: permission.roleCode,
          roleName: permission.roleName,
          roleDescription: permission.roleDescription,
          permissions: this.parsePermissions(permission.permissions) ?? [],
          deniedPermissions:
            this.parsePermissions(permission.deniedPermissions) ?? [],
          isActive: permission.isActive,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
          assignedAt: permission.assignedAt,
        },
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new RpcException({
          status: 400,
          message: 'The email, code or role is already registered',
        });
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

      const organizations = await this.getUserOrganizations(user.id);

      return {
        user: userWithoutPassword,
        organizations,
        auth_token: await this.signJWT({ id: user.id }),
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
