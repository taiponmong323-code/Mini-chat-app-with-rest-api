import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayload } from 'jsonwebtoken';
import { Strategy } from 'passport-jwt';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req) => {
        if (
          process.env.NODE_ENV === 'development' ||
          process.env.NODE_ENV === 'test'
        ) {
          if (req.headers?.cookie) {
            return req.headers?.cookie;
          }
        }
        return req.cookies.refresh_token;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get('REFRESH_TOKEN_SECRET') as string,
    });
  }
  async validate(payload: JwtPayload) {
    return payload;
  }
}
