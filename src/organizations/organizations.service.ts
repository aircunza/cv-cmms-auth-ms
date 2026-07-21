import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma.service';
import {
  CreateOrganizationDto,
  FindAllOrganizationsDto,
  UpdateOrganizationDto,
} from './dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(createOrganizationDto: CreateOrganizationDto) {
    const { code, name, countryCode, countryName, timezone, offsetMinutes } =
      createOrganizationDto;

    const id = randomUUID();

    try {
      const duplicatedCode = await this.prisma.organization.findFirst({
        where: {
          code,
        },
      });

      if (duplicatedCode) {
        throw new RpcException({
          status: 400,
          message: 'The code is already registered',
        });
      }

      const duplicatedActiveName = await this.prisma.organization.findFirst({
        where: {
          name,
          isActive: 'Y',
        },
      });

      if (duplicatedActiveName) {
        throw new RpcException({
          status: 400,
          message: 'The name is already registered',
        });
      }

      const organization = await this.prisma.organization.create({
        data: {
          id,
          code,
          name,
          countryCode,
          countryName,
          timezone,
          offsetMinutes,
          isActive: 'Y',
        },
      });

      return { organization };
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

  async findOneOrganization(id: string) {
    try {
      const organization = await this.prisma.organization.findFirst({
        where: {
          id,
          isActive: 'Y',
        },
      });

      if (!organization) {
        throw new RpcException({
          status: 404,
          message: 'Organization not found',
        });
      }

      return { organization };
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

  async findAllOrganizations(findAllOrganizationsDto: FindAllOrganizationsDto) {
    const { code, name, countryCode } = findAllOrganizationsDto;

    try {
      const organizations = await this.prisma.organization.findMany({
        where: {
          isActive: 'Y',
          ...(code ? { code: { contains: code } } : {}),
          ...(name ? { name: { contains: name } } : {}),
          ...(countryCode ? { countryCode: { contains: countryCode } } : {}),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        organizations,
        total: organizations.length,
      };
    } catch (_error) {
      throw new RpcException({
        status: 500,
        message: 'Internal server error',
      });
    }
  }

  async updateOrganization(updateOrganizationDto: UpdateOrganizationDto) {
    const {
      id,
      code,
      name,
      countryCode,
      countryName,
      timezone,
      offsetMinutes,
    } = updateOrganizationDto;

    try {
      const organization = await this.prisma.organization.findFirst({
        where: {
          id,
          isActive: 'Y',
        },
      });

      if (!organization) {
        throw new RpcException({
          status: 404,
          message: 'Organization not found',
        });
      }

      if (code !== undefined) {
        const duplicatedCode = await this.prisma.organization.findFirst({
          where: {
            id: {
              not: id,
            },
            code,
          },
        });

        if (duplicatedCode) {
          throw new RpcException({
            status: 400,
            message: 'The code is already registered',
          });
        }
      }

      if (name !== undefined) {
        const duplicatedName = await this.prisma.organization.findFirst({
          where: {
            id: {
              not: id,
            },
            name,
            isActive: 'Y',
          },
        });

        if (duplicatedName) {
          throw new RpcException({
            status: 400,
            message: 'The name is already registered',
          });
        }
      }

      const hasUpdatableFields =
        code !== undefined ||
        name !== undefined ||
        countryCode !== undefined ||
        countryName !== undefined ||
        timezone !== undefined ||
        offsetMinutes !== undefined;

      if (!hasUpdatableFields) {
        throw new RpcException({
          status: 400,
          message: 'No fields to update',
        });
      }

      const updatedOrganization = await this.prisma.organization.update({
        where: { id },
        data: {
          ...(code !== undefined ? { code } : {}),
          ...(name !== undefined ? { name } : {}),
          ...(countryCode !== undefined ? { countryCode } : {}),
          ...(countryName !== undefined ? { countryName } : {}),
          ...(timezone !== undefined ? { timezone } : {}),
          ...(offsetMinutes !== undefined ? { offsetMinutes } : {}),
          updatedAt: new Date(),
        },
      });

      return { organization: updatedOrganization };
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

  async deactivateOrganization(id: string) {
    try {
      const organization = await this.prisma.organization.findFirst({
        where: {
          id,
          isActive: 'Y',
        },
      });

      if (!organization) {
        throw new RpcException({
          status: 404,
          message: 'Organization not found',
        });
      }

      const updatedOrganization = await this.prisma.organization.update({
        where: { id },
        data: {
          isActive: 'N',
          updatedAt: new Date(),
        },
      });

      return {
        organization: updatedOrganization,
        message: 'Organization deactivated successfully',
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
