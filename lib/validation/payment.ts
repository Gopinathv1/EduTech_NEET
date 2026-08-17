import { z } from 'zod';

export const createOrderSchema = z.object({ testId: z.string().min(1) });

// Field names match what Razorpay Checkout returns in its success handler.
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
