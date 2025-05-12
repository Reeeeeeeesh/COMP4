import { BrowserContext } from '@playwright/test';
import { CompResult } from '../../src/api/client';

export async function setupMockServer(context: BrowserContext) {
  // Add route to intercept API calls
  await context.route('http://localhost:8000/calc/', async (route) => {
    const request = route.request();
    const body = JSON.parse((await request.postData()) || '{}');
    console.log('E2E Mock received request body:', JSON.stringify(body, null, 2)); // Log the received body

    // Try to get revenue, prioritizing revenue_actual but falling back to revenue
    const revenue =
      body.revenue_actual !== undefined ? body.revenue_actual : body.revenue;
    const shouldBreach = revenue > 5000000;

    let responseBody: CompResult;
    if (shouldBreach) {
      responseBody = {
        base: 100000,
        bonus: 350000, // High bonus to trigger breach assertion
        revenue_adjustment: 0,
        qualitative_adjustment: 0,
        total_comp: 100000 + 350000 + 0 + 0,
        breaches: ['Exceeds maximum bonus'],
      };
    } else {
      responseBody = {
        base: 100000, // Corresponds to $100,000 in test
        bonus: 30000, // Corresponds to $30,000 in test
        revenue_adjustment: 10000, // Part of $20,000 Adjustments
        qualitative_adjustment: 10000, // Part of $20,000 Adjustments
        total_comp: 100000 + 30000 + 10000 + 10000, // $150,000
        breaches: [],
      };
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });
}
