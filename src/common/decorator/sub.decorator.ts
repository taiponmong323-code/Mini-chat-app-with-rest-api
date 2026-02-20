import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Sub = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user.sub;
  },
);
