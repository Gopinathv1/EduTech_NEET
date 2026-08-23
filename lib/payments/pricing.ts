export const MOCK_TEST_PRICE_INR = 30;
export const PAYMENT_CURRENCY = 'INR';

export function getMockTestPriceInr(): number {
  return MOCK_TEST_PRICE_INR;
}

export function inrToPaise(amountInr: number): number {
  return amountInr * 100;
}
