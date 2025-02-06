import { Model } from '@models/base';
import { Prisma } from '@prisma/client';
import { DefaultArgs, InternalArgs } from '@prisma/client/runtime/library';

type TypeMapModel<
  M extends Model,
  ExtArgs extends InternalArgs = DefaultArgs,
> = Prisma.TypeMap<ExtArgs>['model'][M];

export type TypeMapArgs<
  M extends Model,
  O extends keyof Prisma.TypeMap<ExtArgs>['model'][Model]['operations'],
  ExtArgs extends InternalArgs = DefaultArgs,
> = TypeMapModel<M, ExtArgs>['operations'][O]['args'];

export type TypeMapPayload<
  M extends Model,
  ExtArgs extends InternalArgs = DefaultArgs,
> = TypeMapModel<M, ExtArgs>['payload'];
