import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FindAllUsersDto, UserIdDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('user.find.one')
  findOneUser(@Payload() userIdDto: UserIdDto) {
    return this.usersService.findOneUser(userIdDto.id);
  }

  @MessagePattern('user.find.all')
  findAllUsers(@Payload() findAllUsersDto: FindAllUsersDto = {}) {
    return this.usersService.findAllUsers(findAllUsersDto);
  }
}
