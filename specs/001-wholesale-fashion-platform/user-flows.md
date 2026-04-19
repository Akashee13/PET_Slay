# User Flows: Wholesale Fashion Reseller Platform MVP

## Purpose

This document derives the user-facing flows that the mobile app, admin app, and
backend APIs must support. It sits between the product spec and UI/API
implementation so we can design screens and endpoints from the same journey.

## Reseller Mobile App Flows

### Flow 1: First Open and Login

**Actor**: Reseller buyer from North India.

**Goal**: Enter the app quickly using a familiar identity provider and reach the
catalog in the correct language.

**Steps**
1. Buyer opens the app.
2. App shows a welcome screen with English, Hindi, and Hinglish language choice.
3. Buyer chooses language.
4. Buyer signs in with Google first; Facebook remains supported when configured.
5. App calls `GET /v1/me`.
6. If profile is incomplete, app asks for business name, phone, city/state, and
   reseller type.
7. App saves language through `PUT /v1/buyers/preferences/language`.
8. Buyer lands on the catalog home.

**Backend responsibilities**
- Verify auth session.
- Create or hydrate reseller buyer profile.
- Persist preferred language.
- Return role-aware profile data.

### Flow 2: Browse New and Trending Inventory

**Actor**: Reseller buyer.

**Goal**: Quickly find fresh, trend-accurate, affordable products to resell.

**Steps**
1. Buyer opens catalog home.
2. App highlights new arrivals and trending edits.
3. Buyer filters by western or South Asian category.
4. Buyer sees availability state, MOQ, wholesale price, and cover image.
5. Buyer opens product detail.
6. Product detail shows sizes, colors, measurements, MOQ, price, and stock state.

**Backend responsibilities**
- Serve localized catalog metadata.
- Return only reseller-visible active products.
- Hide exact stock count and expose availability state.
- Support category and collection filters.

### Flow 3: Place Wholesale Order

**Actor**: Reseller buyer.

**Goal**: Submit a wholesale order without confusion around MOQ and refunds.

**Steps**
1. Buyer selects variant and quantity.
2. App validates obvious quantity issues.
3. Backend validates variant availability and MOQ.
4. Buyer enters or confirms shipping address.
5. App submits `POST /v1/orders`.
6. Buyer sees order confirmation and refund policy: store credit default, admin
   exception possible for payment-source refund.

**Backend responsibilities**
- Validate order has at least one item.
- Validate product/variant availability and MOQ at submit time.
- Calculate totals from backend price.
- Persist order and order items transactionally.
- Return order detail with refund policy.

### Flow 4: Notification Re-Engagement

**Actor**: Reseller buyer.

**Goal**: Receive useful new-arrival or trending alerts without spam.

**Steps**
1. Buyer opts into notifications.
2. App registers Expo token through `POST /v1/buyers/device-tokens`.
3. Buyer receives a localized notification.
4. Tapping notification opens the linked product or collection.
5. If product became unavailable, app lands on a fallback collection view.

**Backend responsibilities**
- Store active device tokens idempotently.
- Match notification language to buyer preference.
- Require campaigns to include catalog context and localized copy.

### Flow 5: Order and Refund Visibility

**Actor**: Reseller buyer.

**Goal**: Understand order status and refund outcome clearly.

**Steps**
1. Buyer opens order history.
2. Buyer opens order detail.
3. App shows order status, items, totals, and refund policy.
4. If refund exists, app shows status and decision type.

**Backend responsibilities**
- Return buyer-scoped order list/detail.
- Return refund decisions only for the authenticated buyer.
- Keep store-credit-first language explicit.

## Admin Web App Flows

### Flow 6: Admin Login and Dashboard

**Actor**: Internal Delhi operator.

**Goal**: Reach operational dashboard quickly and safely.

**Steps**
1. Admin signs in with Google.
2. Backend verifies admin role.
3. Admin lands on dashboard with catalog freshness, pending orders, and campaign
   shortcuts.

**Backend responsibilities**
- Verify admin role separately from buyer role.
- Reject buyer tokens on admin endpoints.

### Flow 7: Create and Publish Product

**Actor**: Admin operator.

**Goal**: Upload trend-led inventory quickly for reseller discovery.

**Steps**
1. Admin opens products.
2. Admin creates product with title, category, wholesale price, MOQ, description,
   image, size profile, variants, and availability state.
3. Admin marks item as new arrival or trend candidate.
4. Product appears in reseller catalog.

**Backend responsibilities**
- Validate required merchandising fields.
- Persist product and variants.
- Keep SKU/slug unique.
- Return product record for admin and buyer views.

### Flow 8: Manage Orders

**Actor**: Admin operator.

**Goal**: Review incoming reseller orders and move them through fulfillment.

**Steps**
1. Admin opens order queue.
2. Admin filters by status.
3. Admin opens order detail.
4. Admin updates status as order moves through confirmation, packing, shipping,
   and completion.

**Backend responsibilities**
- Provide admin order queue.
- Provide order detail with buyer and line-item data.
- Persist status transitions with audit metadata.

### Flow 9: Campaign Creation

**Actor**: Admin operator.

**Goal**: Send converting notifications tied to new arrivals, trending products,
or restocks.

**Steps**
1. Admin opens campaigns.
2. Admin selects campaign type and linked products.
3. Admin writes English, Hindi, and Hinglish copy.
4. Backend validates catalog context and localized copy.
5. Admin sends campaign.

**Backend responsibilities**
- Persist campaign, message variants, and linked products.
- Enforce relevance and non-empty copy.
- Dispatch or queue push delivery.

### Flow 10: Refund Decision

**Actor**: Admin operator.

**Goal**: Apply store-credit-first refund policy with controlled exceptions.

**Steps**
1. Admin opens refund queue.
2. Admin reviews order context and reason.
3. Default decision is store credit.
4. Admin can override to payment source with notes.
5. Buyer sees updated refund status.

**Backend responsibilities**
- Persist refund decision.
- Default missing decision type to store credit.
- Track admin notes and approval identity.

## API Surface Needed By UI

- `GET /v1/me`
- `PUT /v1/buyers/preferences/language`
- `GET /v1/catalog/products`
- `GET /v1/catalog/products/{productId}`
- `POST /v1/orders`
- `GET /v1/orders/{orderId}`
- `POST /v1/buyers/device-tokens`
- `POST /v1/admin/products`
- `PATCH /v1/admin/products/{productId}`
- `GET /v1/admin/orders`
- `POST /v1/admin/notification-campaigns`
- `POST /v1/admin/notification-campaigns/{campaignId}/send`
- `PATCH /v1/admin/refunds/{refundId}`

## Next Backend Gaps

- Replace in-memory stores with Postgres repositories.
- Add buyer order list endpoint for mobile order history.
- Add admin order status update endpoint.
- Add product variant creation/update support.
- Add refund list/detail endpoints for buyer and admin surfaces.
- Add persistent campaign delivery records and push dispatch integration.

