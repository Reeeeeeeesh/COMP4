import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

export const client = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export interface CompRequest {
  employee_id: number;
  revenue_actual: number;
  qualitative_scores: Record<string, number>;
}

export interface CompResult {
  total_comp: number;
  base: number;
  bonus: number;
  revenue_adjustment: number;
  qualitative_adjustment: number;
  breaches: string[];
}

export const calculateCompensation = async (data: CompRequest): Promise<CompResult> => {
  const response = await client.post<CompResult>('/calc/', data);
  return response.data;
};
