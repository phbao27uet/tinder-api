// import { ClassConstructor } from '@common/filter/prisma/prismaFilter.interface'
// import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
// import { Observable, map } from 'rxjs'

// export interface IBaseResponse {
//   Response()
// }

// export class BaseSerialize<T = any, R extends IBaseResponse = any>
//   implements NestInterceptor<T, R>
// {
//   constructor(private readonly ResponseClass: ClassConstructor<R>) {}

//   intercept(
//     context: ExecutionContext,
//     next: CallHandler<T>
//   ): Observable<R> | Promise<Observable<R>> {
//     return next
//       .handle()
//       .pipe(map((data) => new this.ResponseClass(data).Response()))
//   }
// }
