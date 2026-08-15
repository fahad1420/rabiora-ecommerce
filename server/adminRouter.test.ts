import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const adminService = vi.hoisted(() => ({
  listAdminCategories: vi.fn(),
  listAdminProducts: vi.fn(),
  createAdminProduct: vi.fn(),
  updateAdminProduct: vi.fn(),
  deleteAdminProduct: vi.fn(),
  uploadAdminProductImage: vi.fn(),
  setAdminProductCover: vi.fn(),
  removeAdminProductImage: vi.fn(),
  listAdminOrders: vi.fn(),
  advanceOrderStatus: vi.fn(),
  listAdminCustomers: vi.fn(),
  getAdminCustomerDetail: vi.fn(),
}));

vi.mock("./adminService", () => adminService);

import { adminRouter } from "./routers/admin";

const product = {
  categoryId: 1,
  name: "Acceptance-only product",
  slug: "acceptance-only-product",
  sku: "TEST-CRUD-001",
  details: "Isolated router validation fixture.",
  fabric: "Cotton",
  color: "Black",
  priceTaka: 1200,
  oldPriceTaka: 1400,
  stockQuantity: 4,
  featured: false,
};

function caller(role: "admin" | "user" | null) {
  return adminRouter.createCaller({
    user: role ? { id: 7, openId: `${role}-test`, name: "Test", email: null, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  });
}

describe("admin product CRUD and order authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates validated create, update, and remove requests only for administrators", async () => {
    adminService.createAdminProduct.mockResolvedValue({ id: 901, ...product });
    adminService.updateAdminProduct.mockResolvedValue({ id: 901, ...product, name: "Updated acceptance product" });
    adminService.deleteAdminProduct.mockResolvedValue({ success: true });

    await caller("admin").products.create(product);
    await caller("admin").products.update({ id: 901, product: { ...product, name: "Updated acceptance product" } });
    await caller("admin").products.remove({ id: 901 });

    expect(adminService.createAdminProduct).toHaveBeenCalledWith(product);
    expect(adminService.updateAdminProduct).toHaveBeenCalledWith(901, { ...product, name: "Updated acceptance product" });
    expect(adminService.deleteAdminProduct).toHaveBeenCalledWith(901);
  });

  it("rejects invalid product payloads before service invocation", async () => {
    await expect(caller("admin").products.create({ ...product, priceTaka: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(adminService.createAdminProduct).not.toHaveBeenCalled();
  });

  it("rejects guest and non-admin product or order access before a service call", async () => {
    await expect(caller(null).products.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller("user").orders.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(adminService.listAdminProducts).not.toHaveBeenCalled();
    expect(adminService.listAdminOrders).not.toHaveBeenCalled();
  });

  it("passes the authenticated administrator identity to forward status updates", async () => {
    adminService.advanceOrderStatus.mockResolvedValue({ success: true, status: "confirmed" });
    await expect(caller("admin").orders.advanceStatus({ orderId: 45, nextStatus: "confirmed", adminNote: "Validated by acceptance test" })).resolves.toEqual({ success: true, status: "confirmed" });
    expect(adminService.advanceOrderStatus).toHaveBeenCalledWith(45, "confirmed", 7, "Validated by acceptance test");
  });

  it("allows administrators to list customers and fetch a customer detail record", async () => {
    adminService.listAdminCustomers.mockResolvedValue([
      { id: 7, name: "Test Customer", email: "test@example.com", phone: "+8801712345678", role: "user", createdAt: new Date("2024-01-05T00:00:00Z"), totalOrders: 2 },
    ]);
    adminService.getAdminCustomerDetail.mockResolvedValue({
      id: 7,
      name: "Test Customer",
      email: "test@example.com",
      phone: "+8801712345678",
      role: "user",
      createdAt: new Date("2024-01-05T00:00:00Z"),
      orders: [{ id: 1, orderNumber: "RAB-123", totalTaka: 2400, status: "pending", createdAt: new Date("2024-01-06T00:00:00Z") }],
    });

    await expect(caller("admin").customers.list()).resolves.toEqual([
      { id: 7, name: "Test Customer", email: "test@example.com", phone: "+8801712345678", role: "user", createdAt: new Date("2024-01-05T00:00:00Z"), totalOrders: 2 },
    ]);
    await expect(caller("admin").customers.detail({ id: 7 })).resolves.toEqual({
      id: 7,
      name: "Test Customer",
      email: "test@example.com",
      phone: "+8801712345678",
      role: "user",
      createdAt: new Date("2024-01-05T00:00:00Z"),
      orders: [{ id: 1, orderNumber: "RAB-123", totalTaka: 2400, status: "pending", createdAt: new Date("2024-01-06T00:00:00Z") }],
    });

    expect(adminService.listAdminCustomers).toHaveBeenCalledTimes(1);
    expect(adminService.getAdminCustomerDetail).toHaveBeenCalledWith(7);
  });
});
