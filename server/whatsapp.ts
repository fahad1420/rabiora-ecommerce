const RABIORA_OWNER_WHATSAPP = "8801349529274";

export type ClickToWhatsAppOrder = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  districtArea: string;
  fullAddress: string;
  paymentMethod: string;
  totalTaka: number;
  items: Array<{ name: string; quantity: number; lineTotalTaka: number }>;
};

export type OrderNotificationProvider = {
  createCustomerHandoff(order: ClickToWhatsAppOrder): { url: string; message: string };
};

export const clickToWhatsAppProvider: OrderNotificationProvider = {
  createCustomerHandoff(order) {
    const itemLines = order.items.map((item) => `- ${item.quantity} × ${item.name} — ৳${item.lineTotalTaka.toLocaleString("en-BD")}`).join("\n");
    const message = [
      "Rabiora Order",
      `Order: ${order.orderNumber}`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `Delivery area: ${order.districtArea}`,
      `Address: ${order.fullAddress}`,
      "Products:",
      itemLines,
      `Payment: ${order.paymentMethod}`,
      `Total: ৳${order.totalTaka.toLocaleString("en-BD")}`,
    ].join("\n");
    return { url: `https://wa.me/${RABIORA_OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`, message };
  },
};
