import { z } from 'zod';

/**
 * Utils Schema
 */
export const OptionSchemaGenerator = <T>() =>
  z.string().transform<Array<T>>((val, ctx) => {
    const issueNotOption = () => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Not a Options',
      });
      return z.NEVER;
    };
    try {
      const data = JSON.parse(val);
      if (!Array.isArray(data)) return issueNotOption();
      return data;
    } catch (error) {
      return issueNotOption();
    }
  });

const getRangeNumber = (val: string) => {
  try {
    const data = JSON.parse(val);
    if (isNaN(data)) return undefined;
    return data as number;
  } catch (error) {
    return undefined;
  }
};
type RangeNum = ReturnType<typeof getRangeNumber>;
export const RangeSchemaGenerator = () =>
  z.string().transform((val, ctx) => {
    const issueNotRange = () => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Not a Range',
      });
      return z.NEVER;
    };
    const [startStr, endStr] = val.split('-');

    try {
      const start = getRangeNumber(startStr);
      const end = getRangeNumber(endStr);

      // return !isNaN(start) && !isNaN(end)
      if (start === null && end === null) return issueNotRange();
      return [start, end] as [RangeNum, RangeNum];
    } catch (error) {
      return issueNotRange();
    }
  });
