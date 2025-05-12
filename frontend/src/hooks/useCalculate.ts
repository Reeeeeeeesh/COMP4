import { useMutation } from '@tanstack/react-query';
import {
  calculateCompensation,
  type CompRequest,
  type CompResult,
} from '../api/client';

export const useCalculate = () => {
  return useMutation<CompResult, Error, CompRequest>({
    mutationFn: calculateCompensation,
  });
};
