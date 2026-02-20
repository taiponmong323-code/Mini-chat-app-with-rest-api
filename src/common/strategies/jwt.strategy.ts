import { Injectable, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
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
        return req.cookies.access_token;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get('ACCESS_TOKEN_SECRET') as string,
    });
  }
  async validate(payload: JwtPayload) {
    return payload;
  }
}
