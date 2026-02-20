import { INestApplication } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { Request, Response } from 'express';
import { JwtModule } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import argon2 from 'argon2';
const resMock = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
} as unknown as Response;

describe('AuthController (int)', () => {
  let app: INestApplication;
  let controller: AuthController;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, JwtModule.register({})],
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    controller = module.get<AuthController>(AuthController);
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
    it('should be return authService.register', async () => {
      const user = await controller.register(
        { username: 'hello', email: 'hello1@gmail.com', password: '123' },
        resMock,
      );
      expect(user.id).toBeDefined();
      expect(user.email).toEqual('hello1@gmail.com');
      expect(user.username).toEqual('hello');
      expect(user.password).toBeDefined();
      expect(user.phone).toBeNull();
    });
  });

  describe('login', () => {
    it('should be return authService.login', async () => {
      await controller.register(
        { username: 'hello', email: 'hello1@gmail.com', password: '123' },
        resMock,
      );
      const user = await controller.login(
        { email: 'hello1@gmail.com', password: '123' },
        resMock,
      );
      expect(user.id).toBeDefined();
      expect(user.email).toEqual('hello1@gmail.com');
      expect(user.username).toEqual('hello');
      expect(user.password).toBeDefined();
      expect(user.phone).toBeNull();
    });
  });
  describe('refresh', () => {
    it('should be return authService.refreshToken', async () => {
      const userReg = await controller.register(
        { username: 'hello', email: 'hello1@gmail.com', password: '123' },
        resMock,
      );
      await prisma.user.update({
        where: {
          id: userReg.id,
        },
        data: {
          refresh_token: await argon2.hash('rt-token'),
        },
      });
      await expect(
        controller.refreshToken(
          {
            user: { sub: userReg.id },
            cookies: { refresh_token: 'rt-token' },
          } as any,
          resMock,
        ),
      ).resolves.toBeDefined();
    });
  });
  describe('logout', () => {
    it('should be retrun authService.logout', async () => {
      const userReg = await controller.register(
        { username: 'hello', email: 'hello1@gmail.com', password: '123' },
        resMock,
      );
      await prisma.user.update({
        where: {
          id: userReg.id,
        },
        data: {
          refresh_token: await argon2.hash('rt-token'),
        },
      });
      await expect(
        controller.logout(
          {
            user: { sub: userReg.id },
            cookies: { refresh_token: 'rt-token' },
          } as any,
          resMock,
        ),
      ).resolves.toEqual('logout successful');
    });
  });
});
