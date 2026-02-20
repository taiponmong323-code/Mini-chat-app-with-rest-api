import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import argon2 from 'argon2';
import { RegisterDto } from '../common/dtos/auth/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from '../common/dtos/auth/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}
  private async getToken(sub: string, username: string, res: Response) {
    const refreshToken = await this.jwtService.signAsync(
      {
        sub,
        username,
      },
      {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
        expiresIn: '7d',
      },
    );
    const accessToken = await this.jwtService.signAsync(
      {
        sub,
        username,
      },
      {
        secret: this.configService.get('ACCESS_TOKEN_SECRET'),
        expiresIn: '15m',
      },
    );

    try {
      await this.prismaService.user.update({
        where: {
          id: sub,
        },
        data: {
          refresh_token: await argon2.hash(refreshToken),
        },
      });
    } catch (err) {
      throw new UnauthorizedException('access denied');
    }

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
      sameSite: 'strict',
      secure: !(
        process.env.NODE_ENV === 'test' ||
        process.env.NODE_ENV === 'development'
      ),
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: !(
        process.env.NODE_ENV === 'test' ||
        process.env.NODE_ENV === 'development'
      ),
    });
    return { access_token: accessToken };
  }
  async refreshToken(id: string, rtToken: string, res: Response) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });

    if (!user?.refresh_token) throw new UnauthorizedException('access denied');
    if (!(await argon2.verify(user.refresh_token, rtToken)))
      throw new ForbiddenException('wrong refresh token');
    return await this.getToken(user.id, user.username, res);
  }

  async register(dto: RegisterDto, res: Response) {
    let user: {
      username: string;
      id: string;
      phone: string | null;
      email: string | null;
      profile: string | null;
      password: string;
      created_at: Date;
      refresh_token: string | null;
    };
    if (
      await this.prismaService.user.findFirst({
        where: {
          email: dto.email,
          phone: dto.phone,
        },
      })
    )
      throw new BadRequestException('user exists');
    if ((dto.email && dto.phone) || (!dto.email && !dto.phone))
      throw new BadRequestException('can not create user');

    try {
      user = await this.prismaService.user.create({
        data: {
          username: dto.username.trim(),
          password: await argon2.hash(dto.password.trim()),
          email: dto.email?.trim() || null,
          phone: dto.phone?.trim() || null,
          profile:
            'https://res.cloudinary.com/dryz9qrvx/image/upload/v1766739974/chat_app_uploads/rhjumarzlpwyktuzjglx.png',
        },
      });
    } catch (error) {
      throw new BadRequestException('can not create user');
    }
    await this.getToken(user.id, user.username, res);
    return user;
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prismaService.user.findFirst({
      where: {
        email: dto.email,
        phone: dto.phone,
      },
    });
    if (!user) throw new BadRequestException('user not found');
    if (!(await argon2.verify(user.password, dto.password)))
      throw new BadRequestException('wrong password');
    await this.getToken(user.id, user.username, res);
    return user;
  }

  async logout(id: string, rtToken: string, res: Response) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (!user?.refresh_token) throw new UnauthorizedException('access denied');
    if (!(await argon2.verify(user.refresh_token, rtToken)))
      throw new BadRequestException('refresh token wrong');
    try {
      await this.prismaService.user.update({
        where: {
          id,
        },
        data: {
          refresh_token: null,
        },
      });
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return 'logout successful';
    } catch (err) {
      throw new BadRequestException('can not logout');
    }
  }
}
