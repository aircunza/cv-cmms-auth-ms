import { AuthController } from '../../src/auth/auth.controller';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('src/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('AuthController', () => {
  const authServiceMock = {
    health: jest.fn(),
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    verifyToken: jest.fn(),
    logoutUser: jest.fn(),
  };

  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authServiceMock as never);
  });

  it('delegates health to AuthService', () => {
    authServiceMock.health.mockReturnValue({ status: 'ok' });

    expect(controller.health()).toEqual({ status: 'ok' });
    expect(authServiceMock.health).toHaveBeenCalledTimes(1);
  });

  it('delegates registerUser to AuthService', async () => {
    const dto = { email: 'user@example.com' };
    authServiceMock.registerUser.mockReturnValue(
      Promise.resolve({ user: dto }),
    );

    await expect(controller.registerUser(dto as never)).resolves.toEqual({
      user: dto,
    });
    expect(authServiceMock.registerUser).toHaveBeenCalledWith(dto);
  });

  it('delegates loginUser to AuthService', async () => {
    const dto = { email: 'user@example.com', password: 'secret123' };
    authServiceMock.loginUser.mockReturnValue(
      Promise.resolve({ token: 'token' }),
    );

    await expect(controller.loginUser(dto as never)).resolves.toEqual({
      token: 'token',
    });
    expect(authServiceMock.loginUser).toHaveBeenCalledWith(dto);
  });

  it('delegates verifyToken to AuthService', () => {
    authServiceMock.verifyToken.mockReturnValue({ token: 'token' });

    expect(controller.verifyToken('token')).toEqual({ token: 'token' });
    expect(authServiceMock.verifyToken).toHaveBeenCalledWith('token');
  });

  it('delegates logoutUser to AuthService', () => {
    authServiceMock.logoutUser.mockReturnValue({ status: 'ok' });

    expect(controller.logoutUser('token')).toEqual({ status: 'ok' });
    expect(authServiceMock.logoutUser).toHaveBeenCalledWith('token');
  });
});
