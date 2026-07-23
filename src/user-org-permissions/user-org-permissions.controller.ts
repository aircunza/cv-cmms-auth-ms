import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateUserOrgPermissionDto,
  FindAllUserOrgPermissionsDto,
  UpdateUserOrgPermissionDto,
  UserOrgPermissionIdDto,
} from './dto';
import { UserOrgPermissionsService } from './user-org-permissions.service';

@Controller('user-org-permissions')
export class UserOrgPermissionsController {
  constructor(
    private readonly userOrgPermissionsService: UserOrgPermissionsService,
  ) {}

  @MessagePattern('user.org.permissions.create')
  createUserOrgPermission(
    @Payload() createUserOrgPermissionDto: CreateUserOrgPermissionDto,
  ) {
    return this.userOrgPermissionsService.createUserOrgPermission(
      createUserOrgPermissionDto,
    );
  }

  @MessagePattern('user.org.permissions.find.one')
  findOneUserOrgPermission(
    @Payload() userOrgPermissionIdDto: UserOrgPermissionIdDto,
  ) {
    return this.userOrgPermissionsService.findOneUserOrgPermission(
      userOrgPermissionIdDto,
    );
  }

  @MessagePattern('user.org.permissions.find.all')
  findAllUserOrgPermissions(
    @Payload()
    findAllUserOrgPermissionsDto: FindAllUserOrgPermissionsDto = {},
  ) {
    return this.userOrgPermissionsService.findAllUserOrgPermissions(
      findAllUserOrgPermissionsDto,
    );
  }

  @MessagePattern('user.org.permissions.update')
  updateUserOrgPermission(
    @Payload()
    payload: {
      id: string;
      updates: UpdateUserOrgPermissionDto;
    },
  ) {
    return this.userOrgPermissionsService.updateUserOrgPermission(payload);
  }

  @MessagePattern('user.org.permissions.deactivate')
  deactivateUserOrgPermission(
    @Payload() userOrgPermissionIdDto: UserOrgPermissionIdDto,
  ) {
    return this.userOrgPermissionsService.deactivateUserOrgPermission(
      userOrgPermissionIdDto,
    );
  }
}
