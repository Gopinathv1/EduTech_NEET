import { z } from 'zod';

export const marketplaceConditionSchema = z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']);
export const marketplaceListingTypeSchema = z.enum(['NEW', 'USED']);

export const marketplaceSellerRegistrationSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional(),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
});

export const marketplaceListingDraftSchema = z.object({
  title: z.string().trim().min(3).max(160),
  categoryId: z.string().min(1),
  author: z.string().trim().max(120).optional(),
  publisher: z.string().trim().max(120).optional(),
  edition: z.string().trim().max(80).optional(),
  condition: marketplaceConditionSchema,
  listingType: marketplaceListingTypeSchema,
  description: z.string().trim().min(20).max(3000),
  price: z.number().int().min(1).max(500000),
  originalPrice: z.number().int().min(1).max(500000).optional(),
  quantityAvailable: z.number().int().min(1).max(999),
  locationCity: z.string().trim().min(2).max(80),
  locationState: z.string().trim().min(2).max(80),
  deliveryAvailable: z.boolean(),
});

export const marketplaceOrderDraftSchema = z.object({
  items: z
    .array(
      z.object({
        listingId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(20),
  shippingAddressId: z.string().min(1),
});

export type MarketplaceSellerRegistrationInput = z.infer<typeof marketplaceSellerRegistrationSchema>;
export type MarketplaceListingDraftInput = z.infer<typeof marketplaceListingDraftSchema>;
export type MarketplaceOrderDraftInput = z.infer<typeof marketplaceOrderDraftSchema>;
