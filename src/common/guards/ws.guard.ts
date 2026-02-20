import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class WsGuard extends AuthGuard('ws') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ok = (await super.canActivate(context)) as boolean;
    if (!ok) return false;
    const client = context.switchToWs().getClient();
    const payload = client.user;
    client.data = payload;
    return true;
  }
}
