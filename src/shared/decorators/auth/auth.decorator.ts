import { UseGuards, applyDecorators } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../roles.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { AuthGuard } from 'src/models/auth/guards/auth.guard';

export function Auth(...roles: Role[]) {
  return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard));
}

export const AuthAdmin = Auth(Role.ADMIN);
export const AuthUser = Auth(Role.USER);
