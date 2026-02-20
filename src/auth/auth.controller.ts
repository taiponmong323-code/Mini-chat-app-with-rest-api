import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { Public } from '../common/decorator/public.decorator';
import { RefreshGuard } from '../common/guards/refresh.guard';
import { JwtPayload } from 'jsonwebtoken';
import { RegisterDto } from '../common/dtos/auth/register.dto';
import { LoginDto } from '../common/dtos/auth/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto, res);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @Public()
  @UseGuards(RefreshGuard)
  @Post('refresh')
  refreshToken(
    @Req()
    req: Request & JwtPayload & { user: { sub: string; username: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    let refresh_token = '';
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      refresh_token = req.headers?.cookie
        ? req.headers?.cookie
        : req.cookies.refresh_token;
    } else {
      refresh_token = req.cookies?.refresh_token;
    }
    return this.authService.refreshToken(req.user.sub, refresh_token, res);
  }
  @Public()
  @UseGuards(RefreshGuard)
  @Post('logout')
  logout(
    @Req()
    req: Request & JwtPayload & { user: { sub: string; username: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    let refresh_token = '';
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      refresh_token = req.headers?.cookie
        ? req.headers?.cookie
        : req.cookies.refresh_token;
    } else {
      refresh_token = req.cookies?.refresh_token;
    }
    return this.authService.logout(req.user.sub, refresh_token, res);
  }
}
