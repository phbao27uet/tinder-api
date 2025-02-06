import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodValidationException } from 'nestjs-zod';

@Catch(ZodValidationException)
export class ZodValidationExceptionFilter
  implements ExceptionFilter<ZodValidationException>
{
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(e: ZodValidationException, host: ArgumentsHost): void {
    console.log('ZodValidationException', e?.message);

    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const path = httpAdapter.getRequestUrl(ctx.getRequest());
    const timestamp = new Date().toISOString();
    const statusCode = e.getStatus();

    httpAdapter.reply(
      ctx.getResponse(),
      {
        message: JSON.parse(e.getZodError().message),
        statusCode,
        timestamp,
        path,
      },
      statusCode,
    );
  }
}
