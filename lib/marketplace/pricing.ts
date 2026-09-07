export type MarketplacePricedItem = {
  listingId: string;
  sellerProfileId: string;
  title: string;
  requestedQuantity: number;
  availableQuantity: number;
  unitPrice: number;
};

export type MarketplaceOrderPrice = {
  itemSubtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: 'INR';
  items: Array<{
    listingId: string;
    sellerProfileId: string;
    titleSnapshot: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

export function calculateMarketplaceOrderPrice(input: {
  items: MarketplacePricedItem[];
  deliveryFee?: number;
  discount?: number;
}): MarketplaceOrderPrice {
  const deliveryFee = input.deliveryFee ?? 0;
  const discount = input.discount ?? 0;

  if (deliveryFee < 0 || discount < 0) {
    throw new Error('Marketplace order adjustments cannot be negative');
  }

  const items = input.items.map((item) => {
    if (item.requestedQuantity < 1 || item.requestedQuantity > item.availableQuantity) {
      throw new Error(`Invalid quantity for listing ${item.listingId}`);
    }
    if (item.unitPrice < 1) {
      throw new Error(`Invalid price for listing ${item.listingId}`);
    }
    return {
      listingId: item.listingId,
      sellerProfileId: item.sellerProfileId,
      titleSnapshot: item.title,
      quantity: item.requestedQuantity,
      unitPrice: item.unitPrice,
      total: item.unitPrice * item.requestedQuantity,
    };
  });

  const itemSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = itemSubtotal + deliveryFee - discount;
  if (total < 1) {
    throw new Error('Marketplace order total must be positive');
  }

  return {
    itemSubtotal,
    deliveryFee,
    discount,
    total,
    currency: 'INR',
    items,
  };
}
