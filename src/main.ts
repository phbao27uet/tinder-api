import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './models/app.module';
import {
  AllExceptionsFilter,
  ZodValidationExceptionFilter,
} from '@shared/filter';
import { HTTPExceptionFilter } from '@shared/filter/http';
import {
  PrismaClientKnownRequestFilter,
  PrismaClientValidationFilter,
} from '@shared/filter/prisma';
import * as bodyParser from 'body-parser';
import { Logger } from '@nestjs/common';

const logger = new Logger('Application');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || '9981';

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const httpAdapterHost = app.get(HttpAdapterHost);

  app.useGlobalFilters(
    new AllExceptionsFilter(httpAdapterHost),
    new PrismaClientKnownRequestFilter(httpAdapterHost),
    new PrismaClientValidationFilter(httpAdapterHost),
    new HTTPExceptionFilter(httpAdapterHost),
    new ZodValidationExceptionFilter(httpAdapterHost),
  );
  // app.useGlobalGuards();

  await app.listen(PORT, () =>
    console.log(`Server is listening on port ${PORT}`),
  );
}

process.on('exit', exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

try {
  bootstrap().catch((err) => {
    logger.error(err, err?.stack);
  });
} catch (err: any) {
  logger.error(err, err?.stack);
}

function exitHandler(options: any, exitCode: any) {
  if (options?.cleanup) {
    logger.log('exit: clean');
  }
  if (exitCode || exitCode === 0) {
    if (exitCode !== 0) {
      logger.error(exitCode, exitCode.stack);
    } else {
      logger.log(`exit: code - ${exitCode}`);
    }
  }
  if (options?.exit) {
    process.exit();
  }
}
