import { PaginatedResult } from '../interfaces/paginated-result.interface';

export interface PaginateOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  where?: any;
  searchFields?: string[];
}

export async function paginate<T>(
  prisma: any,
  model: string,
  options: PaginateOptions,
  extraArgs?: any,
): Promise<PaginatedResult<T>> {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';

  const where: any = { ...options.where };

  if (options.search && options.searchFields?.length) {
    where.OR = options.searchFields.map((field) => ({
      [field]: { contains: options.search },
    }));
  }

  const [data, total] = await Promise.all([
    prisma[model].findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      ...extraArgs,
    }),
    prisma[model].count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
