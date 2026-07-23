import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { Prisma, UserOrgPermission } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import {
  CreateUserOrgPermissionDto,
  FindAllUserOrgPermissionsDto,
  UpdateUserOrgPermissionDto,
  UserOrgPermissionIdDto,
} from './dto';

@Injectable()
export class UserOrgPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  private serializePermissions(value: string[] | undefined): string | null {
    if (!value) {
      return null;
    }

    return JSON.stringify(value);
  }

  private parsePermissions(value: string | null): string[] | null {
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) {
        return null;
      }

      return parsed.filter((item) => typeof item === 'string');
    } catch {
      return null;
    }
  }

  private mapPermission(permission: UserOrgPermission) {
    return {
      id: permission.id,
      userId: permission.userId,
      organizationId: permission.organizationId,
      roleCode: permission.roleCode,
      roleName: permission.roleName,
      roleDescription: permission.roleDescription,
      permissions: this.parsePermissions(permission.permissions) ?? [],
      deniedPermissions:
        this.parsePermissions(permission.deniedPermissions ?? null) ?? [],
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      assignedAt: permission.assignedAt,
    };
  }

  private isKnownRequestError(error: unknown, code: string) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === code
    );
  }

  async createUserOrgPermission(
    createUserOrgPermissionDto: CreateUserOrgPermissionDto,
  ) {
    const {
      userId,
      organizationId,
      roleCode,
      roleName,
      roleDescription,
      permissions,
      deniedPermissions,
      assignedAt,
    } = createUserOrgPermissionDto;
    const id = randomUUID();

    try {
      const user = await this.prisma.user.findFirst({ where: { id: userId } });
      if (!user) {
        throw new RpcException({
          status: 404,
          message: 'User not found',
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

      const permission = await this.prisma.userOrgPermission.create({
        data: {
          id,
          userId,
          organizationId,
          roleCode,
          roleName,
          roleDescription,
          permissions: JSON.stringify(permissions),
          deniedPermissions: this.serializePermissions(deniedPermissions),
          isActive: 'Y',
          assignedAt: assignedAt ? new Date(assignedAt) : new Date(),
          updatedAt: new Date(),
        },
      });

      return { userOrgPermission: this.mapPermission(permission) };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      if (this.isKnownRequestError(error, 'P2002')) {
        throw new RpcException({
          status: 409,
          message: 'Role code already exists for this user and organization',
        });
      }

      throw new RpcException({
        status: 500,
        message: 'Internal server error',
      });
    }
  }

  async findOneUserOrgPermission(
    userOrgPermissionIdDto: UserOrgPermissionIdDto,
  ) {
    const { id } = userOrgPermissionIdDto;

    try {
      const permission = await this.prisma.userOrgPermission.findFirst({
        where: {
          id,
          isActive: 'Y',
        },
      });

      if (!permission) {
        throw new RpcException({
          status: 404,
          message: 'User organization permission not found',
        });
      }

      return { userOrgPermission: this.mapPermission(permission) };
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

  async findAllUserOrgPermissions(
    findAllUserOrgPermissionsDto: FindAllUserOrgPermissionsDto,
  ) {
    const { userId, organizationId, roleCode, isActive } =
      findAllUserOrgPermissionsDto;

    try {
      const permissions = await this.prisma.userOrgPermission.findMany({
        where: {
          ...(userId ? { userId } : {}),
          ...(organizationId ? { organizationId } : {}),
          ...(roleCode ? { roleCode: { contains: roleCode } } : {}),
          ...(isActive ? { isActive } : { isActive: 'Y' }),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        userOrgPermissions: permissions.map((permission) =>
          this.mapPermission(permission),
        ),
        total: permissions.length,
      };
    } catch {
      throw new RpcException({
        status: 500,
        message: 'Internal server error',
      });
    }
  }

  async updateUserOrgPermission(payload: {
    id: string;
    updates: UpdateUserOrgPermissionDto;
  }) {
    const { id, updates } = payload;

    const {
      roleCode,
      roleName,
      roleDescription,
      permissions,
      deniedPermissions,
    } = updates;

    try {
      const permission = await this.prisma.userOrgPermission.findFirst({
        where: {
          id,
          isActive: 'Y',
        },
      });

      if (!permission) {
        throw new RpcException({
          status: 404,
          message: 'User organization permission not found',
        });
      }

      const hasUpdatableFields =
        roleCode !== undefined ||
        roleName !== undefined ||
        roleDescription !== undefined ||
        permissions !== undefined ||
        deniedPermissions !== undefined;

      if (!hasUpdatableFields) {
        throw new RpcException({
          status: 400,
          message: 'No fields to update',
        });
      }

      const updatedPermission = await this.prisma.userOrgPermission.update({
        where: {
          id,
        },
        data: {
          ...(roleCode !== undefined ? { roleCode } : {}),
          ...(roleName !== undefined ? { roleName } : {}),
          ...(roleDescription !== undefined ? { roleDescription } : {}),
          ...(permissions !== undefined
            ? { permissions: JSON.stringify(permissions) }
            : {}),
          ...(deniedPermissions !== undefined
            ? {
                deniedPermissions: this.serializePermissions(deniedPermissions),
              }
            : {}),
          updatedAt: new Date(),
        },
      });

      return { userOrgPermission: this.mapPermission(updatedPermission) };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      if (this.isKnownRequestError(error, 'P2002')) {
        throw new RpcException({
          status: 409,
          message: 'Role code already exists for this user and organization',
        });
      }

      throw new RpcException({
        status: 500,
        message: 'Internal server error',
      });
    }
  }

  async deactivateUserOrgPermission(
    userOrgPermissionIdDto: UserOrgPermissionIdDto,
  ) {
    const { id } = userOrgPermissionIdDto;

    try {
      const permission = await this.prisma.userOrgPermission.findFirst({
        where: {
          id,
          isActive: 'Y',
        },
      });

      if (!permission) {
        throw new RpcException({
          status: 404,
          message: 'User organization permission not found',
        });
      }

      const updatedPermission = await this.prisma.userOrgPermission.update({
        where: {
          id,
        },
        data: {
          isActive: 'N',
          updatedAt: new Date(),
        },
      });

      return {
        userOrgPermission: this.mapPermission(updatedPermission),
        message: 'User organization permission deactivated successfully',
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
}
