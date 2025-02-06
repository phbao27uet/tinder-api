import { HttpStatus } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaClientKnownHandler } from './prismaFilter.interface';
import {
  DEFAULT_MESSAGE,
  DEFAULT_RESPONSE,
  NOT_FOUND_RESPONSE,
} from '@models/auth/constants/filter';

export class DefaultPrismaClientKnownHandler
  implements PrismaClientKnownHandler
{
  handle(_error: PrismaClientKnownRequestError) {
    return DEFAULT_RESPONSE;
  }
}

export class P2000 implements PrismaClientKnownHandler {
  handle(error: PrismaClientKnownRequestError) {
    return {
      message: `Value for ${error.meta?.column_name} is too long`,
      statusCode: HttpStatus.BAD_REQUEST,
    };
  }
}
export class P2001 implements PrismaClientKnownHandler {
  handle(_error: PrismaClientKnownRequestError) {
    return NOT_FOUND_RESPONSE;
  }
}

export class P2002 implements PrismaClientKnownHandler {
  handle(_error: PrismaClientKnownRequestError) {
    return {
      message: 'Unique constraint failed',
      statusCode: HttpStatus.CONFLICT,
    };
  }
}

export class P2012 implements PrismaClientKnownHandler {
  handle(_error: PrismaClientKnownRequestError) {
    return {
      message: 'Missing a required value',
      statusCode: HttpStatus.BAD_REQUEST,
    };
  }
}

export class P2013 implements PrismaClientKnownHandler {
  handle(_error: PrismaClientKnownRequestError) {
    return {
      message: DEFAULT_MESSAGE,
      statusCode: HttpStatus.BAD_REQUEST,
    };
  }
}

export class P2015 implements PrismaClientKnownHandler {
  handle(_error: PrismaClientKnownRequestError) {
    return NOT_FOUND_RESPONSE;
  }
}
export class P2018 implements PrismaClientKnownHandler {
  handle(_error: PrismaClientKnownRequestError) {
    return NOT_FOUND_RESPONSE;
  }
}

export class P2025 implements PrismaClientKnownHandler {
  handle(_error: PrismaClientKnownRequestError) {
    return NOT_FOUND_RESPONSE;
  }
}
