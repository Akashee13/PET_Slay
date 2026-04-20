import type { CreateOrderRequest, Order } from "@pet-slay/types";

import type { BuyerApiClient } from "../../services/buyer-api";

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

export function createOrderController(options: { api: BuyerApiClient }): OrderController {
  return {
    async submitOrder(input) {
      const payload: CreateOrderRequest = {
        items: [{ productVariantId: input.productVariantId, quantity: input.quantity }],
        shippingAddress: input.shippingAddress,
        notes: input.notes,
      };

      return options.api.createOrder(payload);
    },
    validateWholesaleQuantity({ quantity, moq }) {
      if (quantity < moq) {
        throw new Error("quantity_below_moq");
      }
    },
  };
}
