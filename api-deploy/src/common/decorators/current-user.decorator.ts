import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type RequestUser = {
  /** id interne (DB) */
  id: string;
  /** id Cognito (sub) */
  cognitoSub: string;
  email?: string;
  username?: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
