import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configurations from './configurations';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configurations],
      // validate: (config) => {
      //   console.log(config);
      //   return config;
      // },
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule { }
