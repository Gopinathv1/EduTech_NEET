CREATE TYPE "MarketplaceSellerStatus" AS ENUM ('REGISTERED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "MarketplaceCondition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR');
CREATE TYPE "MarketplaceListingType" AS ENUM ('NEW', 'USED');
CREATE TYPE "MarketplaceListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'PAUSED', 'REJECTED', 'SOLD_OUT', 'REMOVED');
CREATE TYPE "MarketplaceOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "MarketplacePaymentStatus" AS ENUM ('CREATED', 'SUCCESS', 'FAILED', 'REFUNDED');

CREATE TABLE "MarketplaceSellerProfile" (
  "id" TEXT NOT NULL,
  "studentId" TEXT,
  "agencyId" TEXT,
  "displayName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "email" TEXT,
  "mobile" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "status" "MarketplaceSellerStatus" NOT NULL DEFAULT 'REGISTERED',
  "reviewNote" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceSellerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceCategory" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" JSONB NOT NULL,
  "parentId" TEXT,
  "description" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceListing" (
  "id" TEXT NOT NULL,
  "sellerProfileId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "author" TEXT,
  "publisher" TEXT,
  "edition" TEXT,
  "condition" "MarketplaceCondition" NOT NULL,
  "listingType" "MarketplaceListingType" NOT NULL,
  "description" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "originalPrice" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "quantityAvailable" INTEGER NOT NULL DEFAULT 1,
  "locationCity" TEXT NOT NULL,
  "locationState" TEXT NOT NULL,
  "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false,
  "status" "MarketplaceListingStatus" NOT NULL DEFAULT 'DRAFT',
  "moderationNote" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceImage" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceAddress" (
  "id" TEXT NOT NULL,
  "studentId" TEXT,
  "name" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "line1" TEXT NOT NULL,
  "line2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'India',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceAddress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceOrder" (
  "id" TEXT NOT NULL,
  "buyerStudentId" TEXT NOT NULL,
  "shippingAddressId" TEXT NOT NULL,
  "status" "MarketplaceOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "itemSubtotal" INTEGER NOT NULL,
  "deliveryFee" INTEGER NOT NULL DEFAULT 0,
  "discount" INTEGER NOT NULL DEFAULT 0,
  "total" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceOrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "sellerProfileId" TEXT NOT NULL,
  "titleSnapshot" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  CONSTRAINT "MarketplaceOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplacePayment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "razorpayOrderId" TEXT,
  "razorpayPaymentId" TEXT,
  "status" "MarketplacePaymentStatus" NOT NULL DEFAULT 'CREATED',
  "failureReason" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplacePayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplacePaymentEvent" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "fromStatus" "MarketplacePaymentStatus",
  "toStatus" "MarketplacePaymentStatus" NOT NULL,
  "source" TEXT NOT NULL,
  "detail" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplacePaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketplaceSellerProfile_studentId_key" ON "MarketplaceSellerProfile"("studentId");
CREATE UNIQUE INDEX "MarketplaceSellerProfile_agencyId_key" ON "MarketplaceSellerProfile"("agencyId");
CREATE INDEX "MarketplaceSellerProfile_status_idx" ON "MarketplaceSellerProfile"("status");
CREATE INDEX "MarketplaceSellerProfile_createdAt_idx" ON "MarketplaceSellerProfile"("createdAt");
CREATE UNIQUE INDEX "MarketplaceCategory_slug_key" ON "MarketplaceCategory"("slug");
CREATE INDEX "MarketplaceCategory_parentId_idx" ON "MarketplaceCategory"("parentId");
CREATE INDEX "MarketplaceCategory_isActive_order_idx" ON "MarketplaceCategory"("isActive", "order");
CREATE UNIQUE INDEX "MarketplaceListing_slug_key" ON "MarketplaceListing"("slug");
CREATE INDEX "MarketplaceListing_sellerProfileId_idx" ON "MarketplaceListing"("sellerProfileId");
CREATE INDEX "MarketplaceListing_categoryId_idx" ON "MarketplaceListing"("categoryId");
CREATE INDEX "MarketplaceListing_status_idx" ON "MarketplaceListing"("status");
CREATE INDEX "MarketplaceListing_listingType_condition_idx" ON "MarketplaceListing"("listingType", "condition");
CREATE INDEX "MarketplaceListing_price_idx" ON "MarketplaceListing"("price");
CREATE INDEX "MarketplaceListing_locationState_locationCity_idx" ON "MarketplaceListing"("locationState", "locationCity");
CREATE INDEX "MarketplaceImage_listingId_order_idx" ON "MarketplaceImage"("listingId", "order");
CREATE INDEX "MarketplaceOrder_buyerStudentId_idx" ON "MarketplaceOrder"("buyerStudentId");
CREATE INDEX "MarketplaceOrder_status_idx" ON "MarketplaceOrder"("status");
CREATE INDEX "MarketplaceOrder_createdAt_idx" ON "MarketplaceOrder"("createdAt");
CREATE INDEX "MarketplaceOrderItem_orderId_idx" ON "MarketplaceOrderItem"("orderId");
CREATE INDEX "MarketplaceOrderItem_sellerProfileId_idx" ON "MarketplaceOrderItem"("sellerProfileId");
CREATE INDEX "MarketplaceOrderItem_listingId_idx" ON "MarketplaceOrderItem"("listingId");
CREATE UNIQUE INDEX "MarketplacePayment_razorpayOrderId_key" ON "MarketplacePayment"("razorpayOrderId");
CREATE UNIQUE INDEX "MarketplacePayment_razorpayPaymentId_key" ON "MarketplacePayment"("razorpayPaymentId");
CREATE INDEX "MarketplacePayment_orderId_idx" ON "MarketplacePayment"("orderId");
CREATE INDEX "MarketplacePayment_status_idx" ON "MarketplacePayment"("status");
CREATE INDEX "MarketplacePayment_createdAt_idx" ON "MarketplacePayment"("createdAt");
CREATE INDEX "MarketplacePaymentEvent_paymentId_idx" ON "MarketplacePaymentEvent"("paymentId");

ALTER TABLE "MarketplaceSellerProfile" ADD CONSTRAINT "MarketplaceSellerProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketplaceSellerProfile" ADD CONSTRAINT "MarketplaceSellerProfile_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketplaceCategory" ADD CONSTRAINT "MarketplaceCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MarketplaceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "MarketplaceSellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MarketplaceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceImage" ADD CONSTRAINT "MarketplaceImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_buyerStudentId_fkey" FOREIGN KEY ("buyerStudentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "MarketplaceAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrderItem" ADD CONSTRAINT "MarketplaceOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketplaceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrderItem" ADD CONSTRAINT "MarketplaceOrderItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrderItem" ADD CONSTRAINT "MarketplaceOrderItem_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "MarketplaceSellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplacePayment" ADD CONSTRAINT "MarketplacePayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketplaceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplacePaymentEvent" ADD CONSTRAINT "MarketplacePaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "MarketplacePayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
