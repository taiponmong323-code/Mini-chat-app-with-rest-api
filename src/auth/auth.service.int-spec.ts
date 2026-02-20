import {
  BadRequestException,
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Response } from 'express';
import argon2 from 'argon2';

const resMock = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
} as unknown as Response;

describe('AuthService (int)', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, JwtModule.register({})],
      providers: [AuthService, PrismaService, ConfigService],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.cleanDB();
  });

  afterAll(async () => {
    await prisma.cleanDB();
    await app.close();
    await prisma.onModuleDestroy();
  });

  describe('register', () => {
    it('should be throw if user exists', async () => {
      await prisma.user.create({
        data: {
          email: 'hello123@gmail.com',
          username: 'hello',
          password: '123',
        },
      });

      await expect(
        service.register(
          { email: 'hello123@gmail.com', username: 'hello', password: '123' },
          resMock,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.register(
          { email: 'hello123@gmail.com', username: 'hello', password: '123' },
          resMock,
        ),
      ).rejects.toThrow('user exists');
      const user = await prisma.user.findUnique({
        where: { email: 'hello123@gmail.com' },
      });
      expect(user).not.toBeNull();
    });
    it('should be throw if dto.email && dto.phone', async () => {
      await expect(
        service.register(
          {
            email: 'hello123@gmail.com',
            phone: '+855123456112',
            password: '123',
            username: 'hello',
          },
          resMock,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.register(
          {
            email: 'hello123@gmail.com',
            phone: '+855123456112',
            password: '123',
            username: 'hello',
          },
          resMock,
        ),
      ).rejects.toThrow('can not create user');
    });

    it('should be throw if !dto.email && !dto.phone', async () => {
      await expect(
        service.register({ username: 'hello', password: '123' }, resMock),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.register({ username: 'hello', password: '123' }, resMock),
      ).rejects.toThrow('can not create user');
    });
    it('should create user if use email', async () => {
      const user = await service.register(
        { username: 'hello ', password: '123', email: 'hello1@gmail.com' },
        resMock,
      );
      expect(user.id).toBeDefined();
      expect(user.username).toEqual('hello');
      expect(user.password).toBeDefined();
      expect(user.email).toEqual('hello1@gmail.com');
      expect(user.phone).toEqual(null);
      expect(user.profile).toBeDefined();
    });
    it('should create user if use phone', async () => {
      const user = await service.register(
        { username: 'hello ', password: '123', phone: '+855961234567' },
        resMock,
      );
      expect(user.id).toBeDefined();
      expect(user.username).toEqual('hello');
      expect(user.password).toBeDefined();
      expect(user.phone).toEqual('+855961234567');
      expect(user.email).toEqual(null);
      expect(user.profile).toBeDefined();
    });
  });
  describe('login', () => {
    it('should be throw if user not exist', async () => {
      await expect(
        service.login({ email: 'hello1@gmail.com', password: '123' }, resMock),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.login({ email: 'hello1@gmail.com', password: '123' }, resMock),
      ).rejects.toThrow('user not found');
    });
    it('should be throw if verify password wrong', async () => {
      await prisma.user.create({
        data: {
          username: 'hello',
          password: await argon2.hash('123'),
          email: 'hello1@gmail.com',
        },
      });
      await expect(
        service.login({ email: 'hello1@gmail.com', password: '12' }, resMock),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.login({ email: 'hello1@gmail.com', password: '12' }, resMock),
      ).rejects.toThrow('wrong password');
    });
    it('it should be return user if use correct email', async () => {
      await prisma.user.create({
        data: {
          email: 'hello1@gmail.com',
          password: await argon2.hash('123'),
          username: 'hello',
        },
      });
      const user = await service.login(
        { email: 'hello1@gmail.com', password: '123' },
        resMock,
      );
      expect(user.id).toBeDefined();
      expect(user.email).toEqual('hello1@gmail.com');
      expect(user.password).toBeDefined();
      expect(user.username).toEqual('hello');
      expect(user.phone).toBeNull();
    });
    it('it should be return user if use correct phone', async () => {
      await prisma.user.create({
        data: {
          phone: '+855963456789',
          password: await argon2.hash('123'),
          username: 'hello',
        },
      });
      const user = await service.login(
        { phone: '+855963456789', password: '123' },
        resMock,
      );
      expect(user.id).toBeDefined();
      expect(user.phone).toEqual('+855963456789');
      expect(user.password).toBeDefined();
      expect(user.username).toEqual('hello');
      expect(user.email).toBeNull();
    });
  });

  describe('logout', () => {
    it('should be throw if user not exists', async () => {
      await expect(
        service.logout('user-id', 'refresh-token', resMock),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.logout('user-id', 'refresh-token', resMock),
      ).rejects.toThrow('access denied');
    });
    it('should be throw if refreshToken not exist', async () => {
      let user = await prisma.user.create({
        data: {
          username: 'hello',
          email: 'hello123@gmail.com',
          password: '123',
        },
      });
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          refresh_token: null,
        },
      });
      await expect(
        service.logout(user.id, 'rt-token', resMock),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.logout(user.id, 'rt-token', resMock),
      ).rejects.toThrow('access denied');
    });
    it('should be throw if verify refreshToken false', async () => {
      const user = await service.register(
        { email: 'hello1@gmail.com', username: 'hello', password: '123' },
        resMock,
      );
      await expect(
        service.logout(user.id, 'rt-token', resMock),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.logout(user.id, 'rt-token', resMock),
      ).rejects.toThrow('refresh token wrong');
    });
    it('should be return logout successful', async () => {
      let user = await service.register(
        { email: 'hello1@gmail.com', username: 'hello', password: '123' },
        resMock,
      );
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          refresh_token: await argon2.hash('rt-token'),
        },
      });
      const userLogout = await service.logout(user.id, 'rt-token', resMock);
      expect(userLogout).toEqual('logout successful');
    });
  });
});
