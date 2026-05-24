import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage<{ clinicId: number | null }>();
