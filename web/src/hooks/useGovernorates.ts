import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useGovernorates() {
  return useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      const { data } = await api.get('/locations/governorates');
      return data.data;
    },
  });
}
