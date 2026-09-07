import { describe, expect, it } from 'vitest';
import { calculateMarketplaceOrderPrice } from '@/lib/marketplace/pricing';

describe('calculateMarketplaceOrderPrice', () => {
  it('calculates marketplace totals from server-side item prices', () => {
    const price = calculateMarketplaceOrderPrice({
      deliveryFee: 60,
      discount: 40,
      items: [
        {
          listingId: 'listing-1',
          sellerProfileId: 'seller-1',
          title: 'NEET Biology Practice Bundle',
          requestedQuantity: 2,
          availableQuantity: 3,
          unitPrice: 420,
        },
      ],
    });

    expect(price).toMatchObject({
      itemSubtotal: 840,
      deliveryFee: 60,
      discount: 40,
      total: 860,
      currency: 'INR',
    });
    expect(price.items[0]).toMatchObject({
      listingId: 'listing-1',
      sellerProfileId: 'seller-1',
      titleSnapshot: 'NEET Biology Practice Bundle',
      quantity: 2,
      unitPrice: 420,
      total: 840,
    });
  });

  it('rejects quantities that exceed current stock', () => {
    expect(() =>
      calculateMarketplaceOrderPrice({
        items: [
          {
            listingId: 'listing-1',
            sellerProfileId: 'seller-1',
            title: 'NEET Biology Practice Bundle',
            requestedQuantity: 2,
            availableQuantity: 1,
            unitPrice: 420,
          },
        ],
      }),
    ).toThrow('Invalid quantity');
  });
});
