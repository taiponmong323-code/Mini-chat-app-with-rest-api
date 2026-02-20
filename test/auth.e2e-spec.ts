import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { JwtModule } from '@nestjs/jwt';
import request from 'supertest';
import cookieParser from 'cookie-parser';

describe('auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, JwtModule.register({})],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    app.use(cookieParser());

    app.enableCors({
      origin: true,
      credentials: true,
    });
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.cleanDB();
  });

  afterAll(async () => {
    await prisma.cleanDB();
    await prisma.onModuleDestroy();
    await app.close();
  });

  describe('Post /auth/register', () => {
    it('should be register is use email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'hello@gmail.com', username: 'hello', password: '123' })
        .expect(201);
      expect(res.body).toBeDefined();
      expect(res.body.email).toEqual('hello@gmail.com');
      expect(res.body.username).toEqual('hello');
      expect(res.body.password).toBeDefined();
      const rawCookies = res.headers['set-cookie'];
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      expect(cookies.some((c) => c.startsWith('refresh_token'))).toBe(true);
      expect(cookies.some((c) => c.startsWith('access_token'))).toBe(true);
    });
    it('should be register is use phone', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ phone: '+855961234567', username: 'hello', password: '123' })
        .expect(201);
      expect(res.body).toBeDefined();
      expect(res.body.phone).toEqual('+855961234567');
      expect(res.body.username).toEqual('hello');
      expect(res.body.password).toBeDefined();
      const rawCookies = res.headers['set-cookie'];
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      expect(cookies.some((c) => c.startsWith('refresh_token'))).toBe(true);
      expect(cookies.some((c) => c.startsWith('access_token'))).toBe(true);
    });
  });
  describe('Post /auth/login', () => {
    it('should be login is use email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'hello@gmail.com', username: 'hello', password: '123' })
        .expect(201);
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'hello@gmail.com', password: '123' })
        .expect(201);
      expect(res.body).toBeDefined();
      expect(res.body.email).toEqual('hello@gmail.com');
      expect(res.body.username).toEqual('hello');
      expect(res.body.password).toBeDefined();
      const rawCookies = res.headers['set-cookie'];
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      expect(cookies.some((c) => c.startsWith('refresh_token'))).toBe(true);
      expect(cookies.some((c) => c.startsWith('access_token'))).toBe(true);
    });
    it('should be login is use phone', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ phone: '+855961234567', username: 'hello', password: '123' })
        .expect(201);
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: '+855961234567', password: '123' })
        .expect(201);
      expect(res.body).toBeDefined();
      expect(res.body.phone).toEqual('+855961234567');
      expect(res.body.username).toEqual('hello');
      expect(res.body.password).toBeDefined();
      const rawCookies = res.headers['set-cookie'];
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      expect(cookies.some((c) => c.startsWith('refresh_token'))).toBe(true);
      expect(cookies.some((c) => c.startsWith('access_token'))).toBe(true);
    });
  });
  describe('Post /auth/refresh', () => {
    it('should be refresh', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'hello@gmail.com', username: 'hello', password: '123' })
        .expect(201);
      expect(res.body).toBeDefined();
      expect(res.body.email).toEqual('hello@gmail.com');
      expect(res.body.username).toEqual('hello');
      expect(res.body.password).toBeDefined();
      const rawCookies = res.headers['set-cookie'];
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith('access_token'))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refresh_token'))).toBe(true);
      const refresh_token_cookie = cookies
        .find((c) => c.startsWith('refresh_token'))
        .split('=')[1]
        .split(';')[0];
      expect(refresh_token_cookie).toBeDefined();

      const resRefresh = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refresh_token_cookie)
        .expect(201);

      expect(resRefresh.body).toHaveProperty('access_token');
    });
  });
  describe('Post /auth/logout', () => {
    it('should be logout', async () => {
      const resRegister = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'hello@gmail.com', username: 'hello', password: '123' })
        .expect(201);
      expect(resRegister.body.email).toBe('hello@gmail.com');
      expect(resRegister.body.username).toBe('hello');
      expect(resRegister.body.password).toBeDefined();
      const rawCookies = resRegister.headers['set-cookie'];
      expect(rawCookies).toBeDefined();
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      expect(cookies).toBeDefined();
      const refresh_token_cookie = cookies
        .find((c) => c.startsWith('refresh_token'))
        .split('=')[1]
        .split(';')[0];

      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [refresh_token_cookie])
        .expect(201);

      expect(res.text).toBe('logout successful');
    });
  });
});
