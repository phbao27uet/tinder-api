import { Prisma } from '@prisma/client';
import {
  BaseCountArgs,
  BaseFindManyArgs,
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
import { DefaultFindAllQueryDto, SEARCH_FIELD_DEFAULT } from '../dto';
import { IBaseRepository } from '../repository';
import { BaseResponse } from './base.response';
import {
  FindAllWithPaginationOption,
  FindAllWithPaginationResponse,
  IBaseService,
} from './base.service.interface';
import { generateSlug } from '@shared/utils';

export abstract class BaseService<M extends Model>
  extends BaseResponse<M>
  implements IBaseService<M>
{
  constructor(private readonly baseRepository: IBaseRepository<M>) {
    super();
  }

  async findAllWithPagination<
    T extends ModelFindManyArgs<M>['where'] & DefaultFindAllQueryDto,
    K extends FindAllWithPaginationOption<M>,
  >(
    queryArgs: Prisma.SelectSubset<
      T,
      NonNullable<ModelFindManyArgs<M>['where'] & DefaultFindAllQueryDto>
    >,
    options?: Prisma.SelectSubset<K, FindAllWithPaginationOption<M>>,
  ): Promise<FindAllWithPaginationResponse<M, K>> {
    const { fields, page, sort, perPage, search, ...query } = queryArgs;
    const defaultFindAllQuery = { fields, page, sort, perPage, search };

    const { searchQuery, ...defaultWhereInput } =
      this._defaultQueryToDefaultWhereInput(defaultFindAllQuery);

    const whereInput = {
      ...defaultWhereInput,
      where: { ...query, ...searchQuery },
    };

    const findManyQuery = this.baseRepository.findMany(
      (options
        ? Object.assign(whereInput, options)
        : whereInput) as BaseFindManyArgs,
    ) as unknown as Prisma.PrismaPromise<ModelQueryResult<M, K, 'findMany'>>;

    const countQuery = this.baseRepository.count({
      where: { ...query, ...searchQuery },
    } as BaseCountArgs);

    const data = await Promise.all([countQuery, findManyQuery]);
    return this._findAllWithPaginationResponse(data, page);
  }

  private _defaultQueryToDefaultWhereInput(query: DefaultFindAllQueryDto) {
    const { fields, page = 1, sort, perPage = 10, search } = query;
    /** OrderBy */
    const orderBy = sort?.split(',').map((item) => {
      const order = item.charAt(0);
      const field = order === '-' ? item.slice(1) : item;
      return { [field]: order === '-' ? 'desc' : 'asc' };
    });
    /** Select */
    const select = fields?.split(',').reduce((acc, item) => {
      acc[item] = true;
      return acc;
    }, {});
    /** Pagination */
    const skip = (page - 1) * perPage;

    /** Search */
    let searchQuery = {};
    if (search) {
      const containsName = generateSlug(search);
      const ftsName = containsName.replaceAll(' ', '&');
      searchQuery = {
        OR: [
          { [SEARCH_FIELD_DEFAULT]: { search: ftsName, mode: 'insensitive' } },
          {
            [SEARCH_FIELD_DEFAULT]: {
              contains: containsName,
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    return { orderBy, select, skip, perPage, searchQuery };
  }

  findUnique<K extends Omit<ModelFindUniqueArgs<M>, 'where'>>(
    id: ModelFindUniqueArgs<M>['where']['id'],
    options?: Prisma.SelectSubset<K, Omit<ModelFindUniqueArgs<M>, 'where'>>,
  ): Prisma.PrismaPromise<ModelQueryResult<M, K, 'findUnique'>> {
    return this.baseRepository.findUnique(id, options);
  }

  findUniqueOrThrow<K extends Omit<ModelFindUniqueOrThrowArgs<M>, 'where'>>(
    id: ModelFindUniqueOrThrowArgs<M>['where']['id'],
    options?: Prisma.SelectSubset<
      K,
      Omit<ModelFindUniqueOrThrowArgs<M>, 'where'>
    >,
  ): Promise<ModelQueryResult<M, K, 'findUniqueOrThrow'>> {
    return this.baseRepository.findUniqueOrThrow(id, options);
  }

  findFirst<
    T extends ModelFindFirstArgs<M>['where'],
    K extends Omit<ModelFindFirstArgs<M>, 'where'>,
  >(
    where?: Prisma.SelectSubset<T, NonNullable<ModelFindFirstArgs<M>['where']>>,
    options?: Prisma.SelectSubset<K, Omit<ModelFindFirstArgs<M>, 'where'>>,
  ): Prisma.PrismaPromise<ModelQueryResult<M, K, 'findFirst'>> {
    return this.baseRepository.findFirst(where, options);
  }

  findFirstOrThrow<
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
    return this.baseRepository.findFirstOrThrow(where, options);
  }

  create<
    T extends ModelCreateArgs<M>['data'],
    K extends Omit<ModelCreateArgs<M>, 'data'>,
  >(
    data: Prisma.SelectSubset<T, ModelCreateArgs<M>['data']>,
    options?: Prisma.SelectSubset<K, Omit<ModelCreateArgs<M>, 'data'>>,
  ): Promise<ModelQueryResult<M, K, 'create'>> {
    return this.baseRepository.create(data, options);
  }

  update<
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
    return this.baseRepository.update(id, data, options);
  }

  delete<T extends Omit<ModelDeleteArgs<M>, 'where'>>(
    id: ModelDeleteArgs<M>['where']['id'],
    options?: Prisma.SelectSubset<T, Omit<ModelDeleteArgs<M>, 'where'>>,
  ): Promise<ModelQueryResult<M, T, 'delete'>> {
    return this.baseRepository.delete(id, options);
  }

  count<T extends ModelCountArgs<M>>(
    args?: Prisma.SelectSubset<T, ModelCountArgs<M>>,
  ): Prisma.PrismaPromise<ModelQueryResult<M, T, 'count'>> {
    return this.baseRepository.count(args);
  }
}
