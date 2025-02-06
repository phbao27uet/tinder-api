import { Prisma, PrismaClient } from '@prisma/client';
import {
  BaseCountArgs,
  BaseCreateArgs,
  BaseDeleteArgs,
  BaseFindFirstArgs,
  BaseFindManyArgs,
  BaseFindUniqueArgs,
  BaseUpdateArgs,
  Model,
  ModelCountArgs,
  ModelCreateArgs,
  ModelDeleteArgs,
  ModelFindFirstArgs,
  ModelFindFirstOrThrowArgs,
  ModelFindManyArgs,
  ModelFindUniqueArgs,
  ModelFindUniqueOrThrowArgs,
  ModelQueryResult,
  ModelUpdateArgs,
} from '../base.interface';
import { IBaseRepository } from './base.repository.interface';

export abstract class BaseRepository<M extends Model>
  implements IBaseRepository<M>
{
  constructor(protected readonly model: PrismaClient[Uncapitalize<M>]) {}

  findMany<T extends ModelFindManyArgs<M>>(
    args?: Prisma.SelectSubset<T, ModelFindManyArgs<M>>,
  ): Prisma.PrismaPromise<ModelQueryResult<M, T, 'findMany'>> {
    const findManyFn = this.model.findMany<BaseFindManyArgs>;
    return findManyFn(args) as unknown as Prisma.PrismaPromise<
      ModelQueryResult<M, T, 'findMany'>
    >;
  }

  findUnique<K extends Omit<ModelFindUniqueArgs<M>, 'where'>>(
    id: ModelFindUniqueArgs<M>['where']['id'],
    options?: Prisma.SelectSubset<K, Omit<ModelFindUniqueArgs<M>, 'where'>>,
  ): Prisma.PrismaPromise<ModelQueryResult<M, K, 'findUnique'>> {
    const findUniqueFn = this.model.findUnique<BaseFindUniqueArgs>;
    const args = options
      ? Object.assign({ where: { id } }, options)
      : { where: { id } };
    return findUniqueFn(args) as Prisma.PrismaPromise<
      ModelQueryResult<M, K, 'findUnique'>
    >;
  }

  async findUniqueOrThrow<
    K extends Omit<ModelFindUniqueOrThrowArgs<M>, 'where'>,
  >(
    id: ModelFindUniqueOrThrowArgs<M>['where']['id'],
    options?: Prisma.SelectSubset<
      K,
      Omit<ModelFindUniqueOrThrowArgs<M>, 'where'>
    >,
  ): Promise<ModelQueryResult<M, K, 'findUniqueOrThrow'>> {
    const findUniqueOrThrowFn = this.model
      .findUniqueOrThrow<BaseFindUniqueArgs>;
    const args = options
      ? Object.assign({ where: { id } }, options)
      : { where: { id } };
    const response = await findUniqueOrThrowFn(args);
    return response as ModelQueryResult<M, K, 'findUniqueOrThrow'>;
  }

  findFirst<
    T extends ModelFindFirstArgs<M>['where'],
    K extends Omit<ModelFindFirstArgs<M>, 'where'>,
  >(
    where?: Prisma.SelectSubset<T, NonNullable<ModelFindFirstArgs<M>['where']>>,
    options?: Prisma.SelectSubset<K, Omit<ModelFindFirstArgs<M>, 'where'>>,
  ): Prisma.PrismaPromise<ModelQueryResult<M, K, 'findFirst'>> {
    const findFirstFn = this.model.findFirst<BaseFindFirstArgs>;
    const args = options ? Object.assign({ where }, options) : { where };
    return findFirstFn(args) as Prisma.PrismaPromise<
      ModelQueryResult<M, K, 'findFirst'>
    >;
  }

  async findFirstOrThrow<
    T extends ModelFindFirstOrThrowArgs<M>['where'],
    K extends Omit<ModelFindFirstOrThrowArgs<M>, 'where'>,
  >(
    where?: Prisma.SelectSubset<
      T,
      NonNullable<ModelFindFirstOrThrowArgs<M>['where']>
    >,
    options?: Prisma.SelectSubset<
      K,
      Omit<ModelFindFirstOrThrowArgs<M>, 'where'>
    >,
  ): Promise<ModelQueryResult<M, K, 'findFirstOrThrow'>> {
    const findFirstOrThrowFn = this.model.findFirstOrThrow<BaseFindFirstArgs>;
    const args = options ? Object.assign({ where }, options) : { where };
    const response = await findFirstOrThrowFn(args);
    return response as ModelQueryResult<M, K, 'findFirstOrThrow'>;
  }

  async create<
    T extends ModelCreateArgs<M>['data'],
    K extends Omit<ModelCreateArgs<M>, 'data'>,
  >(
    data: Prisma.SelectSubset<T, ModelCreateArgs<M>['data']>,
    options?: Prisma.SelectSubset<K, Omit<ModelCreateArgs<M>, 'data'>>,
  ): Promise<ModelQueryResult<M, K, 'create'>> {
    const createFn = this.model.create<BaseCreateArgs>;
    const args = options ? Object.assign({ data }, options) : { data };
    return (await createFn(args)) as ModelQueryResult<M, K, 'create'>;
  }

  async update<
    T extends ModelUpdateArgs<M>['data'],
    K extends Omit<ModelUpdateArgs<M>, 'data' | 'where'>,
  >(
    id: ModelUpdateArgs<M>['where']['id'],
    data: Prisma.SelectSubset<T, ModelUpdateArgs<M>['data']>,
    options?: Prisma.SelectSubset<
      K,
      Omit<ModelUpdateArgs<M>, 'data' | 'where'>
    >,
  ): Promise<ModelQueryResult<M, K, 'update'>> {
    const updateFn = this.model.update<BaseUpdateArgs>;
    const args = options
      ? Object.assign({ where: { id }, data }, options)
      : { where: { id }, data };
    return (await updateFn(args)) as ModelQueryResult<M, K, 'update'>;
  }

  async delete<T extends Omit<ModelDeleteArgs<M>, 'where'>>(
    id: ModelDeleteArgs<M>['where']['id'],
    options?: Prisma.SelectSubset<T, Omit<ModelDeleteArgs<M>, 'where'>>,
  ): Promise<ModelQueryResult<M, T, 'delete'>> {
    const deleteFn = this.model.delete<BaseDeleteArgs>;
    const args = options
      ? Object.assign({ where: { id } }, options)
      : { where: { id } };
    return (await deleteFn(args)) as ModelQueryResult<M, T, 'delete'>;
  }

  count<T extends ModelCountArgs<M>>(
    args?: Prisma.SelectSubset<T, ModelCountArgs<M>>,
  ): Prisma.PrismaPromise<ModelQueryResult<M, T, 'count'>> {
    const countFn = this.model.count<BaseCountArgs>;
    return countFn(args) as unknown as Prisma.PrismaPromise<
      ModelQueryResult<M, T, 'count'>
    >;
  }
}
