import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import argon2 from 'argon2';

const jwtMock = {
  signAsync: jest.fn(),
};

const configMock = {
  get: jest.fn((key) => key),
};

const prismaMock = {
  user: {
    update: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const resMock = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
} as unknown as Response;

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService (Unit)', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: ConfigService,
          useValue: configMock,
        },
        {
          provide: JwtService,
          useValue: jwtMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshToken', () => {
    it('should be throw if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(
        service.refreshToken('user-id', 'rt-token', resMock),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshToken('user-id', 'rt-token', resMock),
      ).rejects.toThrow('access denied');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
      });
    });
    it('should be throw if user.refreshToken is null', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        refresh_token: null,
      });
      await expect(
        service.refreshToken('user-id', 'rt-token', resMock),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshToken('user-id', 'rt-token', resMock),
      ).rejects.toThrow('access denied');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
      });
    });
    it('should be throw if verify false', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        refresh_token: 'rt-token-hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      await expect(
        service.refreshToken('user-id', 'rt-token', resMock),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.refreshToken('user-id', 'rt-token', resMock),
      ).rejects.toThrow('wrong refresh token');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
      });
      expect(argon2.verify as jest.Mock).toHaveBeenCalledWith(
        'rt-token-hash',
        'rt-token',
      );
    });
    it('should be return access token', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        refresh_token: 'rt-token-hash',
        username: 'user',
      });

      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jwtMock.signAsync
        .mockResolvedValueOnce('refresh-token')
        .mockResolvedValueOnce('access-token');
      (argon2.hash as jest.Mock).mockResolvedValue('refresh-token-hash');
      prismaMock.user.update.mockResolvedValue({
        id: 'user-id',
        refresh_token: 'refresh-token-hash',
      });
      await expect(
        service.refreshToken('user-id', 'rt-token', resMock),
      ).resolves.toEqual({
        access_token: 'access-token',
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
      });
      expect(argon2.verify as jest.Mock).toHaveBeenCalledWith(
        'rt-token-hash',
        'rt-token',
      );
      expect(jwtMock.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtMock.signAsync).toHaveBeenCalledWith(
        {
          sub: 'user-id',
          username: 'user',
        },
        {
          secret: configMock.get('REFRESH_TOKEN_SECRET'),
          expiresIn: '7d',
        },
      );
      expect(jwtMock.signAsync).toHaveBeenCalledWith(
        {
          sub: 'user-id',
          username: 'user',
        },
        {
          secret: configMock.get('ACCESS_TOKEN_SECRET'),
          expiresIn: '15m',
        },
      );
      expect(argon2.hash as jest.Mock).toHaveBeenCalledWith('refresh-token');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
        data: {
          refresh_token: 'refresh-token-hash',
        },
      });
    });
  });

  describe('register', () => {
    it('should be throw if user exists', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        email: 'hello1@gmail.com',
      });
      await expect(
        service.register(
          { email: 'hello1@gmail.com', password: '123', username: 'hello' },
          resMock,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.register(
          { email: 'hello1@gmail.com', password: '123', username: 'hello' },
          resMock,
        ),
      ).rejects.toThrow('user exists');
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'hello1@gmail.com',
        },
      });
    });

    it('should throw if there are email and phone', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      await expect(
        service.register(
          {
            email: 'hello1@gmail.com',
            phone: '+441234567890',
            username: 'hello1',
            password: '123',
          },
          resMock,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.register(
          {
            email: 'hello1@gmail.com',
            phone: '+441234567890',
            username: 'hello1',
            password: '123',
          },
          resMock,
        ),
      ).rejects.toThrow('can not create user');
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'hello1@gmail.com',
          phone: '+441234567890',
        },
      });
    });
    it('should throw if there are not email and phone', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      await expect(
        service.register({ password: '123', username: 'hello' }, resMock),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.register({ password: '123', username: 'hello' }, resMock),
      ).rejects.toThrow('can not create user');
      expect(prismaMock.user.findFirst).toHaveBeenCalled();
    });
    it('should throw if create user failed', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockRejectedValue(
        new BadRequestException('can not create user'),
      );
      (argon2.hash as jest.Mock).mockResolvedValue('hash-pw');
      await expect(
        service.register(
          {
            email: 'hello1@gmail.com',
            password: '123',
            username: 'hello',
          },
          resMock,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.register(
          {
            email: 'hello1@gmail.com',
            password: '123',
            username: 'hello',
          },
          resMock,
        ),
      ).rejects.toThrow('can not create user');
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'hello1@gmail.com',
        },
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'hello1@gmail.com',
          password: 'hash-pw',
          username: 'hello',
          phone: null,
          profile:
            'https://res.cloudinary.com/dryz9qrvx/image/upload/v1766739974/chat_app_uploads/rhjumarzlpwyktuzjglx.png',
        },
      });
    });
    it('should return user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValueOnce('hash-pw');
      prismaMock.user.create.mockResolvedValue({
        id: 'user-id',
        username: 'hello',
        password: 'hash-pw',
        email: 'hello1@gmail.com',
        phone: null,
        profile:
          'https://res.cloudinary.com/dryz9qrvx/image/upload/v1766739974/chat_app_uploads/rhjumarzlpwyktuzjglx.png',
      });
      jwtMock.signAsync
        .mockResolvedValueOnce('refresh-token')
        .mockResolvedValueOnce('access-token');

      prismaMock.user.update.mockResolvedValueOnce({
        id: 'user-id',
        refresh_token: (argon2.hash as jest.Mock).mockResolvedValueOnce(
          'refresh-token-hash',
        ),
      });
      await expect(
        service.register(
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
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'hello1@gmail.com',
        },
      });
      expect(argon2.hash as jest.Mock).toHaveBeenCalledTimes(2);
      expect(argon2.hash as jest.Mock).toHaveBeenCalledWith('123');
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          username: 'hello',
          password: 'hash-pw',
          email: 'hello1@gmail.com',
          phone: null,
          profile:
            'https://res.cloudinary.com/dryz9qrvx/image/upload/v1766739974/chat_app_uploads/rhjumarzlpwyktuzjglx.png',
        },
      });
      expect(jwtMock.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtMock.signAsync).toHaveBeenCalledWith(
        {
          sub: 'user-id',
          username: 'hello',
        },
        {
          secret: configMock.get('REFRESH_TOKEN_SECRET'),
          expiresIn: '7d',
        },
      );
      expect(jwtMock.signAsync).toHaveBeenCalledWith(
        {
          sub: 'user-id',
          username: 'hello',
        },
        {
          secret: configMock.get('ACCESS_TOKEN_SECRET'),
          expiresIn: '15m',
        },
      );
      expect(argon2.hash as jest.Mock).toHaveBeenCalledWith('refresh-token');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
        data: {
          refresh_token: 'refresh-token-hash',
        },
      });
    });
  });
  describe('login', () => {
    it('should throw if user in null', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      await expect(
        service.login({ email: 'hello1@gmail.com', password: '123' }, resMock),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.login({ email: 'hello1@gmail.com', password: '123' }, resMock),
      ).rejects.toThrow('user not found');
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'hello1@gmail.com',
        },
      });
    });
    it('should throw verify password false', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        email: 'hello1@gmail.com',
        password: 'hash-pw',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login({ email: 'hello1@gmail.com', password: '123' }, resMock),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.login({ email: 'hello1@gmail.com', password: '123' }, resMock),
      ).rejects.toThrow('wrong password');
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'hello1@gmail.com',
        },
      });
      expect(argon2.verify as jest.Mock).toHaveBeenCalledWith('hash-pw', '123');
    });
  });
  describe('logout', () => {
    it('should throw if user is null', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(
        service.logout('user-id', 'refresh-token', resMock),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.logout('user-id', 'refresh-token', resMock),
      ).rejects.toThrow('access denied');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
      });
    });
    it('should be throw if refresh token is nul', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        refresh_token: null,
      });
      await expect(
        service.logout('user-id', 'refresh-token', resMock),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.logout('user-id', 'refresh-token', resMock),
      ).rejects.toThrow('access denied');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
      });
    });
    it('should be throw if verify refresh token false', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        refresh_token: 'refresh-token-hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      await expect(
        service.logout('user-id', 'refresh-token', resMock),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.logout('user-id', 'refresh-token', resMock),
      ).rejects.toThrow('refresh token wrong');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
      });
      expect(argon2.verify as jest.Mock).toHaveBeenCalledWith(
        'refresh-token-hash',
        'refresh-token',
      );
    });
    it('should be throw if user update false', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        refresh_token: 'refresh-token-hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      prismaMock.user.update.mockRejectedValue(
        new BadRequestException('can not logout'),
      );
      await expect(
        service.logout('user-id', 'refresh-token', resMock),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.logout('user-id', 'refresh-token', resMock),
      ).rejects.toThrow('can not logout');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
      });
      expect(argon2.verify as jest.Mock).toHaveBeenCalledWith(
        'refresh-token-hash',
        'refresh-token',
      );
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
        data: {
          refresh_token: null,
        },
      });
    });
    it('should return logout successful', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        refresh_token: 'refresh-token-hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      prismaMock.user.update.mockResolvedValue({
        id: 'user-id',
        refresh_token: null,
      });
      await expect(
        service.logout('user-id', 'refresh-token', resMock),
      ).resolves.toEqual('logout successful');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
      });
      expect(argon2.verify as jest.Mock).toHaveBeenCalledWith(
        'refresh-token-hash',
        'refresh-token',
      );
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
        },
        data: {
          refresh_token: null,
        },
      });
    });
  });
});
