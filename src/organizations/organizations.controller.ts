import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateOrganizationDto,
  FindAllOrganizationsDto,
  OrganizationIdDto,
  UpdateOrganizationDto,
} from './dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @MessagePattern('organization.create')
  createOrganization(@Payload() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.createOrganization(createOrganizationDto);
  }

  @MessagePattern('organization.find.one')
  findOneOrganization(@Payload() organizationIdDto: OrganizationIdDto) {
    return this.organizationsService.findOneOrganization(organizationIdDto.id);
  }

  @MessagePattern('organization.find.all')
  findAllOrganizations(
    @Payload() findAllOrganizationsDto: FindAllOrganizationsDto = {},
  ) {
    return this.organizationsService.findAllOrganizations(
      findAllOrganizationsDto,
    );
  }

  @MessagePattern('organization.update')
  updateOrganization(@Payload() updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationsService.updateOrganization(updateOrganizationDto);
  }

  @MessagePattern('organization.deactivate')
  deactivateOrganization(@Payload() organizationIdDto: OrganizationIdDto) {
    return this.organizationsService.deactivateOrganization(
      organizationIdDto.id,
    );
  }
}
