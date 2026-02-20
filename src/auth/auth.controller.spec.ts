import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtPayload } from 'jsonwebtoken';

const serviceMock = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
};

const resMock = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
} as unknown as Response;

const reqMock = {
  user: {
    sub: 'user-id',
    username: 'hello',
  } as { sub: string; username: string },
  cookies: {
    refresh_token: 'refreshToken',
  },
} as unknown as Request;
describe('AuthController (Unit)', () => {
  let controller: AuthController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: serviceMock,
        },
      ],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return service.register', () => {
      serviceMock.register.mockResolvedValue({
        id: 'user-id',
        username: 'hello',
        password: 'hash-pw',
        email: 'hello1@gmail.com',
        phone: null,
        profile:
          'https://res.cloudinary.com/dryz9qrvx/image/upload/v1766739974/chat_app_uploads/rhjumarzlpwyktuzjglx.png',
      });
      expect(
        controller.register(
          { email: 'hello1@gmail.com', password: '123', username: 'hello' },
          resMock,
        ),
      ).resolves.toEqual({
        id: 'user-id',
        username: 'hello',
        password: 'hash-pw',
        email: 'hello1@gmail.com',
        phone: null,
        profile:
          'https://res.cloudinary.com/dryz9qrvx/image/upload/v1766739974/chat_app_uploads/rhjumarzlpwyktuzjglx.png',
      });
      expect(serviceMock.register).toHaveBeenCalledWith(
        { email: 'hello1@gmail.com', password: '123', username: 'hello' },
        resMock,
      );
    });
  });
  describe('login', () => {
    it('should return service.login', async () => {
      serviceMock.login.mockResolvedValue({
        id: 'user-id',
        username: 'hello',
        password: 'hash-pw',
        email: 'hello1@gmail.com',
        phone: null,
        profile:
          'https://res.cloudinary.com/dryz9qrvx/image/upload/v1766739974/chat_app_uploads/rhjumarzlpwyktuzjglx.png',
      });
      await expect(
        controller.login(
          { email: 'hello1@gmail.com', password: '123' },
          resMock,
        ),
      ).resolves.toEqual({
        id: 'user-id',
        username: 'hello',
        password: 'hash-pw',
        email: 'hello1@gmail.com',
        phone: null,
        profile:
          'https://res.cloudinary.com/dryz9qrvx/image/upload/v1766739974/chat_app_uploads/rhjumarzlpwyktuzjglx.png',
      });
      expect(serviceMock.login).toHaveBeenCalledWith(
        { email: 'hello1@gmail.com', password: '123' },
        resMock,
      );
    });
  });
  describe('refreshToken', () => {
    it('should return service.refreshToken', async () => {
      serviceMock.refreshToken.mockResolvedValue({
        access_token: 'accessToken',
      });
      await expect(
        controller.refreshToken(reqMock as any, resMock),
      ).resolves.toEqual({
        access_token: 'accessToken',
      });
      expect(serviceMock.refreshToken).toHaveBeenCalledWith(
        'user-id',
        reqMock.cookies.refresh_token,
        resMock,
      );
    });
  });
  describe('logout', () => {
    it('should be return service.logout', async () => {
      serviceMock.logout.mockResolvedValue('logout successful');
      await expect(controller.logout(reqMock as any, resMock)).resolves.toEqual(
        'logout successful',
      );
      expect(serviceMock.logout).toHaveBeenCalledWith(
        'user-id',
        reqMock.cookies.refresh_token,
        resMock,
      );
    });
  });
});
