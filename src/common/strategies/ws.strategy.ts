import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import cookie from 'cookie';
import { Injectable } from '@nestjs/common';
@Injectable()
export class WsStrategy extends PassportStrategy(Strategy, 'ws') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req) => {
        return req?.handshake?.headers?.cookie.split('Bearer ')[1];
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET') as string,
    });
  }
  async validate(payload: any) {
    return payload;
  }
}
