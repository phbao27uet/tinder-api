import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  DefaultPrismaClientKnownHandler,
  P2000,
  P2001,
  P2002,
  P2012,
  P2013,
  P2015,
  P2018,
  P2025,
} from './prismaClientKnown.handler';
import {
  ClassConstructor,
  PrismaClientKnownHandler,
} from './prismaFilter.interface';

@Catch(PrismaClientKnownRequestError)
export class PrismaClientKnownRequestFilter
  implements ExceptionFilter<PrismaClientKnownRequestError>
{
  /** Handler Function */
  private readonly handlers: Map<string, PrismaClientKnownHandler> = new Map();
  /** Handler Class */
  private readonly classHandlers: ClassConstructor<PrismaClientKnownHandler>[] =
    [P2000, P2001, P2002, P2012, P2013, P2015, P2018, P2025];
  private readonly defaultPrismaClientKnownHandler =
    new DefaultPrismaClientKnownHandler();

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {
    this.classHandlers.forEach((Handler) => this._addHandler(new Handler()));
  }

  private _addHandler(handler: PrismaClientKnownHandler): void {
    this.handlers.set(handler.constructor.name, handler);
  }

  private _handle(error: PrismaClientKnownRequestError) {
    const errorHandler =
      this.handlers.get(error.code) || this.defaultPrismaClientKnownHandler;
    return errorHandler.handle(error);
  }

  catch(e: PrismaClientKnownRequestError, host: ArgumentsHost): void {
    console.log('PrismaClientKnownRequestError📕📕📕', e?.message);

    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const path = httpAdapter.getRequestUrl(ctx.getRequest());
    const timestamp = new Date().toISOString();

    // handle
    const { message, statusCode } = this._handle(e);

    httpAdapter.reply(
      ctx.getResponse(),
      {
        message,
        statusCode,
        timestamp,
        path,
      },
      statusCode,
    );
  }
}
