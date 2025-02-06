import { Model, ModelFindManyArgs, ModelQueryResult } from '../base.interface';
import { FindAllWithPaginationResponse } from './base.service.interface';

export abstract class BaseResponse<M extends Model> {
  protected _findAllWithPaginationResponse<
    K extends Omit<
      ModelFindManyArgs<M>,
      'where' | 'orderBy' | 'select' | 'skip' | 'take'
    >,
  >(
    data: [number, ModelQueryResult<M, K, 'findMany'>],
    page: number = 1,
  ): FindAllWithPaginationResponse<M, K> {
    return {
      total: data[0],
      count: data[1].length,
      page,
      data: data[1],
    };
  }
}
