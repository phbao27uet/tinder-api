import { HttpStatus } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface PrismaClientKnownHandler {
  handle: (error: PrismaClientKnownRequestError) => {
    message: string;
    statusCode: HttpStatus;
  };
}

export declare type ClassConstructor<T> = {
  new (...args: any[]): T;
};
