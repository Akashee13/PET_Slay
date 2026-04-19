# Data Model: Wholesale Fashion Reseller Platform MVP

## ResellerBuyer

**Purpose**: Represents a reseller account using the mobile app to browse and
order inventory.

**Fields**
- `id`
- `auth_user_id`
- `display_name`
- `phone`
- `email`
- `preferred_language` (`english`, `hindi`, `hinglish`)
- `region`
- `business_name`
- `status` (`pending`, `active`, `suspended`)
- `created_at`
- `updated_at`

**Relationships**
- Has many `Order`
- Has many `DeviceToken`
- Has many `RefundDecision`

**Validation Rules**
- `preferred_language` is required after onboarding
- At least one contact method must exist
- `status` must be active for ordering

## AdminOperator

**Purpose**: Internal user managing catalog, inventory, pricing, campaigns, and
refund exceptions through the web admin app.

**Fields**
- `id`
- `auth_user_id`
- `name`
- `email`
- `role`
- `status`
- `created_at`
- `updated_at`

**Relationships**
- Creates or updates many `Product`
- Reviews many `Order`
- Creates many `NotificationCampaign`
- Approves many `RefundDecision`

## Product

**Purpose**: A wholesale catalog item available for reseller ordering.

**Fields**
- `id`
- `sku`
- `title`
- `slug`
- `category` (`western`, `south_asian`)
- `subcategory`
- `description`
- `base_wholesale_price`
- `currency`
- `moq`
- `size_profile_id`
- `availability_status` (`in_stock`, `low_stock`, `out_of_stock`, `inactive`)
- `trend_tags`
- `is_new_arrival`
- `media_cover_url`
- `created_at`
- `updated_at`

**Relationships**
- Belongs to one `SizeProfile`
- Has many `ProductVariant`
- Appears in many `OrderItem`
- Can be linked to many `NotificationCampaignItem`

**Validation Rules**
- `sku` must be unique
- `base_wholesale_price` must be positive
- `moq` must be at least 1
- Inactive products cannot be ordered

## ProductVariant

**Purpose**: Represents a sellable size/color option tied to a product.

**Fields**
- `id`
- `product_id`
- `size_label`
- `color_label`
- `inventory_on_hand`
- `reserved_inventory`
- `availability_status`

**Relationships**
- Belongs to one `Product`

**Validation Rules**
- `inventory_on_hand` cannot be negative
- Availability state must align with inventory rules

## SizeProfile

**Purpose**: Captures the consistent fit/sizing information resellers rely on.

**Fields**
- `id`
- `name`
- `measurement_chart`
- `notes`
- `created_at`
- `updated_at`

**Relationships**
- Has many `Product`

## Order

**Purpose**: A reseller wholesale purchase submitted from the mobile app.

**Fields**
- `id`
- `buyer_id`
- `order_number`
- `status` (`pending`, `confirmed`, `packed`, `shipped`, `completed`, `cancelled`)
- `subtotal_amount`
- `discount_amount`
- `total_amount`
- `payment_status`
- `payment_reference`
- `shipping_contact`
- `shipping_address`
- `notes`
- `created_at`
- `updated_at`

**Relationships**
- Belongs to one `ResellerBuyer`
- Has many `OrderItem`
- Has zero or more `RefundDecision`

**Validation Rules**
- Order must contain at least one item
- Each line item must satisfy product MOQ and availability checks at submit time

## OrderItem

**Purpose**: A line item within a wholesale order.

**Fields**
- `id`
- `order_id`
- `product_id`
- `product_variant_id`
- `quantity`
- `unit_price`
- `line_total`

**Relationships**
- Belongs to one `Order`
- Belongs to one `Product`
- Belongs to one `ProductVariant`

**Validation Rules**
- `quantity` must be positive
- `quantity` must satisfy product MOQ rules

## DeviceToken

**Purpose**: Stores mobile push destinations for reseller buyers.

**Fields**
- `id`
- `buyer_id`
- `provider` (`expo`)
- `token`
- `platform` (`ios`, `android`)
- `status`
- `last_seen_at`
- `created_at`

**Relationships**
- Belongs to one `ResellerBuyer`

## NotificationCampaign

**Purpose**: A curated commercial message sent to targeted buyers.

**Fields**
- `id`
- `campaign_type` (`new_arrival`, `trending`, `restock`)
- `audience_rule`
- `status` (`draft`, `scheduled`, `sent`, `cancelled`)
- `scheduled_at`
- `sent_at`
- `created_by_admin_id`
- `created_at`

**Relationships**
- Belongs to one `AdminOperator`
- Has many `NotificationMessageVariant`
- Has many `NotificationCampaignItem`

**Validation Rules**
- A campaign must have at least one language variant before sending
- A campaign must reference at least one product or collection context

## NotificationMessageVariant

**Purpose**: Stores localized copy for a campaign.

**Fields**
- `id`
- `campaign_id`
- `language` (`english`, `hindi`, `hinglish`)
- `title`
- `body`
- `deep_link_target`

**Relationships**
- Belongs to one `NotificationCampaign`

**Validation Rules**
- One variant per language per campaign
- Copy must not be empty for enabled campaign languages

## NotificationCampaignItem

**Purpose**: Associates a campaign with products or merchandising groups.

**Fields**
- `id`
- `campaign_id`
- `product_id`
- `sort_order`

**Relationships**
- Belongs to one `NotificationCampaign`
- Belongs to one `Product`

## RefundDecision

**Purpose**: Captures the approved refund outcome for an order or order item.

**Fields**
- `id`
- `order_id`
- `buyer_id`
- `decision_type` (`store_credit`, `payment_source`)
- `reason_code`
- `admin_notes`
- `approved_by_admin_id`
- `status` (`requested`, `approved`, `rejected`, `processed`)
- `created_at`
- `updated_at`

**Relationships**
- Belongs to one `Order`
- Belongs to one `ResellerBuyer`
- Belongs to one `AdminOperator`

**Validation Rules**
- `decision_type` defaults to `store_credit`
- `payment_source` decisions require an approving admin

## State Transitions

### Order
- `pending -> confirmed -> packed -> shipped -> completed`
- `pending -> cancelled`

### NotificationCampaign
- `draft -> scheduled -> sent`
- `draft -> cancelled`
- `scheduled -> cancelled`

### RefundDecision
- `requested -> approved -> processed`
- `requested -> rejected`
