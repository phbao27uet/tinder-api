import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configurations from './configurations';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller';
import { LlmModule } from './llm/llm.module';
import { GaleShapleyModule } from './gale-shapley/gale-shapley.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UploadModule } from 'src/upload/upload.model';
import { MatchesModule } from './matches/matches.module';
import { MessagesModule } from './messages/messages.module';
import { VipModule } from './vip/vip.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configurations],
    }),
    AuthModule,
    UsersModule,
    LlmModule,
    GaleShapleyModule,
    UploadModule,
    MatchesModule,
    ScheduleModule.forRoot(),
    MessagesModule,
    VipModule,
    PaymentModule
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
