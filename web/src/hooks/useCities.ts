import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useCities(governorateId?: string | null) {
  return useQuery({
    queryKey: ['cities', governorateId],
    queryFn: async () => {
      if (!governorateId) return [];
      const { data } = await api.get('/locations/cities', {
        params: { governorateId },
      });
      return data.data;
    },
    enabled: !!governorateId,
  });
}
