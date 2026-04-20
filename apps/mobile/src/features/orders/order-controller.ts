import type { CreateOrderRequest, Order } from "@pet-slay/types";

import type { BuyerApiClient } from "../../services/buyer-api";
import type { Analytics } from "../../services/analytics";

export type SubmitOrderInput = {
  productVariantId: string;
  quantity: number;
  shippingAddress: Record<string, unknown>;
  notes?: string;
};

export type OrderController = {
  submitOrder: (input: SubmitOrderInput) => Promise<Order>;
  validateWholesaleQuantity: (input: { quantity: number; moq: number }) => void;
};

export function createOrderController(options: { api: BuyerApiClient; analytics?: Analytics }): OrderController {
  return {
    async submitOrder(input) {
      const payload: CreateOrderRequest = {
        items: [{ productVariantId: input.productVariantId, quantity: input.quantity }],
        shippingAddress: input.shippingAddress,
        notes: input.notes,
      };

      try {
        const order = await options.api.createOrder(payload);
        options.analytics?.track("order_submitted", {
          orderId: order.id,
          productVariantId: input.productVariantId,
          quantity: input.quantity,
        });
        return order;
      } catch (error) {
        options.analytics?.recordError("order_submit_failed", error, {
          productVariantId: input.productVariantId,
          quantity: input.quantity,
        });
        throw error;
      }
    },
    validateWholesaleQuantity({ quantity, moq }) {
      if (quantity < moq) {
        options.analytics?.track("order_quantity_rejected", { quantity, moq });
        throw new Error("quantity_below_moq");
      }
    },
  };
}
