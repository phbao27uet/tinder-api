import { Prisma } from '@prisma/client';
import { GetResult, Operation } from '@prisma/client/runtime/library';
import { TypeMapArgs, TypeMapPayload } from 'src/shared/prisma/interface';

export type Model = Prisma.ModelName;

type AllOptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

type AllNonOptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];

/** Maintain key types, keep it's optional '?' */
type MaintainKey<T extends object> = {
  [K in AllNonOptionalKeys<T>]: any;
} & {
  [K in AllOptionalKeys<T>]?: any;
};

/** Model Query Args */
export type ModelFindManyArgs<M extends Model> = TypeMapArgs<M, 'findMany'>;
export type ModelFindUniqueArgs<M extends Model> = TypeMapArgs<M, 'findUnique'>;
export type ModelFindUniqueOrThrowArgs<M extends Model> = TypeMapArgs<
  M,
  'findUniqueOrThrow'
>;
export type ModelFindFirstArgs<M extends Model> = TypeMapArgs<M, 'findFirst'>;
export type ModelFindFirstOrThrowArgs<M extends Model> = TypeMapArgs<
  M,
  'findFirstOrThrow'
>;
export type ModelCreateArgs<M extends Model> = TypeMapArgs<M, 'create'>;
export type ModelUpdateArgs<M extends Model> = TypeMapArgs<M, 'update'>;
export type ModelDeleteArgs<M extends Model> = TypeMapArgs<M, 'delete'>;
export type ModelCountArgs<M extends Model> = TypeMapArgs<M, 'count'>;

/** Base Model Query Args */
export type BaseFindManyArgs = MaintainKey<ModelFindManyArgs<Model>>;
export type BaseFindUniqueArgs = MaintainKey<ModelFindUniqueArgs<Model>>;
export type BaseFindUniqueOrThrowArgs = MaintainKey<
  ModelFindUniqueOrThrowArgs<Model>
>;
export type BaseFindFirstArgs = MaintainKey<ModelFindFirstArgs<Model>>;
export type BaseFindFirstOrThrowArgs = MaintainKey<
  ModelFindFirstOrThrowArgs<Model>
>;
export type BaseCreateArgs = MaintainKey<ModelCreateArgs<Model>>;
export type BaseUpdateArgs = MaintainKey<ModelUpdateArgs<Model>>;
export type BaseDeleteArgs = MaintainKey<ModelDeleteArgs<Model>>;
export type BaseCountArgs = MaintainKey<ModelCountArgs<Model>>;

/** Base Model Query Result */
export type ModelQueryResult<
  M extends Model,
  A,
  O extends Operation,
> = GetResult<TypeMapPayload<M>, A, O>;
