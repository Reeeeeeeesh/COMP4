import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('http://localhost:8000/calc/', async () => {
    return HttpResponse.json({
      base: 100000,
      bonus: 30000,
      adjustments: 20000,
      breaches: [],
    });
  }),
];
