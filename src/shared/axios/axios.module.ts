import { Global, Module } from '@nestjs/common';
import { Axios } from 'axios';
import { AXIOS_INSTANCE_TOKEN } from './axios.constant';
import { AxiosService } from './axios.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    AxiosService,
    {
      provide: AXIOS_INSTANCE_TOKEN,
      useValue: Axios,
    },
  ],
  exports: [AxiosService],
})
export class AxiosModule {}
