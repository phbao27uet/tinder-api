import { DEFAULT_RESPONSE } from '@models/auth/constants/filter';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';

@Catch(PrismaClientValidationError)
export class PrismaClientValidationFilter
  implements ExceptionFilter<PrismaClientValidationError>
{
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(e: PrismaClientValidationError, host: ArgumentsHost): void {
    console.log('PrismaClientValidationError📕📕📕', e?.message);

    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const path = httpAdapter.getRequestUrl(ctx.getRequest());
    const timestamp = new Date().toISOString();

    let responseData = DEFAULT_RESPONSE;

    // handle
    const { message } = e;
    if (message.includes('Unknown argument `slug`')) {
      responseData = {
        message: 'Search is not enabled for this resource.',
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
    httpAdapter.reply(
      ctx.getResponse(),
      {
        ...responseData,
        timestamp,
        path,
      },
      responseData.statusCode,
    );
  }
}
