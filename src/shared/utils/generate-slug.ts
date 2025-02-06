import { StringKeys } from '@shared/interface';
import { z } from 'zod';

export const generateSlug = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(
      /[^\p{Script=Latin}\p{N}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]+/gu,
      ' ',
    )
    .toLowerCase()
    .trim() || str;

export const makeSchemaSlug = <T extends z.AnyZodObject>(
  schema: T,
  ...keys: StringKeys<z.infer<T>>[]
) =>
  schema.transform<z.output<T> & { slug: string }>((value) => ({
    ...value,
    slug: generateSlug(keys.map((key) => value[key]).join(' ')),
  }));
