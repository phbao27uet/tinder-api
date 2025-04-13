import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetRt = createParamDecorator(
  (_: undefined, context: ExecutionContext): number | undefined => {
    const request = context.switchToHttp().getRequest();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  },
);
