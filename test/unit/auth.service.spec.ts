import { RpcException } from '@nestjs/microservices';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import * as bcrypt from 'bcrypt';

import { AuthService } from '../../src/auth/auth.service';
import { LoginUserDto, RegisterUserDto } from '../../src/auth/dto';

jest.mock('src/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('src/config', () => ({
  envs: {
    jwtSecret: 'test-secret',
  },
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-user-id'),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  let service: AuthService;

  const registerDto: RegisterUserDto = {
    code: 'USR001',
    email: 'user@example.com',
    userName: 'Test User',
    userShortName: 'TU',
    password: 'secret123',
  };

  const loginDto: LoginUserDto = {
    email: 'user@example.com',
    password: 'secret123',
  };

  const persistedUser = {
    id: 'test-user-id',
    code: 'USR001',
    email: 'user@example.com',
    userName: 'Test User',
    userShortName: 'TU',
    password: 'hashed-password',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prismaMock as never, jwtServiceMock as never);
  });

  it('signJWT delegates to JwtService', async () => {
    const payload = {
      id: '1',
      code: 'USR001',
      email: 'user@example.com',
      userShortName: 'TU',
    };

    jwtServiceMock.signAsync.mockReturnValue(Promise.resolve('signed-token'));

    await expect(service.signJWT(payload)).resolves.toBe('signed-token');
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(payload);
  });

  it('verifyToken returns the payload without exp and iat', () => {
    jwtServiceMock.verify.mockReturnValue({
      id: '1',
      code: 'USR001',
      email: 'user@example.com',
      userShortName: 'TU',
      iat: 1,
      exp: 2,
    });

    expect(service.verifyToken('token')).toEqual({
      user: {
        id: '1',
        code: 'USR001',
        email: 'user@example.com',
        userShortName: 'TU',
      },
      token: 'token',
    });
    expect(jwtServiceMock.verify).toHaveBeenCalledWith('token', {
      secret: 'test-secret',
    });
  });

  it('verifyToken throws RpcException for invalid tokens', () => {
    jwtServiceMock.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    expect(() => service.verifyToken('bad-token')).toThrow(RpcException);
  });

  it('logoutUser returns ok when token is valid', () => {
    jwtServiceMock.verify.mockReturnValue({
      id: '1',
      code: 'USR001',
      email: 'user@example.com',
      userShortName: 'TU',
      iat: 1,
      exp: 2,
    });

    expect(service.logoutUser('token')).toEqual({
      status: 'ok',
      message: 'Logged out successfully',
    });
  });

  it('logoutUser throws RpcException for invalid tokens', () => {
    jwtServiceMock.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    expect(() => service.logoutUser('bad-token')).toThrow(RpcException);
  });

  it('registerUser creates a user and returns a token', async () => {
    prismaMock.user.findFirst.mockReturnValue(Promise.resolve(null));
    (bcrypt.hash as jest.Mock).mockReturnValue(
      Promise.resolve('hashed-password'),
    );
    prismaMock.user.create.mockReturnValue(Promise.resolve(persistedUser));
    jwtServiceMock.signAsync.mockReturnValue(Promise.resolve('signed-token'));

    await expect(service.registerUser(registerDto)).resolves.toEqual({
      user: {
        id: 'test-user-id',
        code: 'USR001',
        email: 'user@example.com',
        userName: 'Test User',
        userShortName: 'TU',
      },
      token: 'signed-token',
    });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ email: registerDto.email }, { code: registerDto.code }] },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        id: 'test-user-id',
        code: registerDto.code,
        email: registerDto.email,
        userName: registerDto.userName,
        userShortName: registerDto.userShortName,
        password: 'hashed-password',
      },
    });
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      id: 'test-user-id',
      code: 'USR001',
      email: 'user@example.com',
      userName: 'Test User',
      userShortName: 'TU',
    });
  });

  it('registerUser throws when email already exists', async () => {
    prismaMock.user.findFirst.mockReturnValue(
      Promise.resolve({
        email: registerDto.email,
        code: 'OTHER',
      }),
    );

    try {
      await service.registerUser(registerDto);
      throw new Error('Expected registerUser to throw RpcException');
    } catch (error) {
      expect(error).toBeInstanceOf(RpcException);
      expect((error as RpcException).getError()).toEqual({
        status: 400,
        message: 'The email is already registered',
      });
    }
  });

  it('registerUser throws when code already exists', async () => {
    prismaMock.user.findFirst.mockReturnValue(
      Promise.resolve({
        email: 'other@example.com',
        code: registerDto.code,
      }),
    );

    try {
      await service.registerUser(registerDto);
      throw new Error('Expected registerUser to throw RpcException');
    } catch (error) {
      expect(error).toBeInstanceOf(RpcException);
      expect((error as RpcException).getError()).toEqual({
        status: 400,
        message: 'The code is already registered',
      });
    }
  });

  it('loginUser returns a token when the password is valid', async () => {
    prismaMock.user.findUnique.mockReturnValue(Promise.resolve(persistedUser));
    (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(true));
    jwtServiceMock.signAsync.mockReturnValue(Promise.resolve('signed-token'));

    await expect(service.loginUser(loginDto)).resolves.toEqual({
      user: {
        id: 'test-user-id',
        code: 'USR001',
        email: 'user@example.com',
        userName: 'Test User',
        userShortName: 'TU',
      },
      token: 'signed-token',
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: loginDto.email },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      loginDto.password,
      persistedUser.password,
    );
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      id: 'test-user-id',
      code: 'USR001',
      email: 'user@example.com',
      userName: 'Test User',
      userShortName: 'TU',
    });
  });

  it('loginUser throws when the user does not exist', async () => {
    prismaMock.user.findUnique.mockReturnValue(Promise.resolve(null));

    try {
      await service.loginUser(loginDto);
      throw new Error('Expected loginUser to throw RpcException');
    } catch (error) {
      expect(error).toBeInstanceOf(RpcException);
      expect((error as RpcException).getError()).toEqual({
        status: 400,
        message: 'User/Password not valid',
      });
    }
  });

  it('loginUser throws when the password is invalid', async () => {
    prismaMock.user.findUnique.mockReturnValue(Promise.resolve(persistedUser));
    (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(false));

    try {
      await service.loginUser(loginDto);
      throw new Error('Expected loginUser to throw RpcException');
    } catch (error) {
      expect(error).toBeInstanceOf(RpcException);
      expect((error as RpcException).getError()).toEqual({
        status: 400,
        message: 'User/Password not valid',
      });
    }
  });

  it('health returns service status', () => {
    expect(service.health()).toEqual({
      status: 'ok',
      message: 'Auth service is running',
    });
  });
});
