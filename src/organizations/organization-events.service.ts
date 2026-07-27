import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';

@Injectable()
export class OrganizationEventsService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  emitCreated(organization: Record<string, unknown>) {
    this.client.emit('organization.created', { organization });
  }

  emitUpdated(organization: Record<string, unknown>) {
    this.client.emit('organization.updated', { organization });
  }

  emitDeactivated(organization: Record<string, unknown>) {
    this.client.emit('organization.deactivated', { organization });
  }
}
