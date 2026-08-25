import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type ProductForm = {
  categoryId: string;
  name: string;
  slug: string;
  sku: string;
  details: string;
  fabric: string;
  color: string;
  priceTaka: string;
  oldPriceTaka: string;
  stockQuantity: string;
  featured: boolean;
};

const emptyProduct: ProductForm = {
  categoryId: "",
  name: "",
  slug: "",
  sku: "",
  details: "",
  fabric: "",
  color: "",
  priceTaka: "",
  oldPriceTaka: "",
  stockQuantity: "0",
  featured: false,
};

const taka = (value: number) =>
  `৳${value.toLocaleString("en-BD")}`;

function toProductInput(form: ProductForm) {
  const catId = form.categoryId.trim();
  const numCatId = Number(catId);
  const finalCategoryId = !isNaN(numCatId) && String(numCatId) === catId ? numCatId : catId;

  return {
    categoryId: finalCategoryId,
    name: form.name,
    slug: form.slug,
    sku: form.sku || undefined,
    details: form.details,
    fabric: form.fabric,
    color: form.color,
    priceTaka: Number(form.priceTaka),
    oldPriceTaka: form.oldPriceTaka
      ? Number(form.oldPriceTaka)
      : undefined,
    stockQuantity: Number(form.stockQuantity),
    featured: form.featured,
  };
}

function ProductManager() {
  const utils = trpc.useUtils();
  const products = trpc.admin.products.list.useQuery();
  const categories = trpc.admin.categories.list.useQuery();

  const create = trpc.admin.products.create.useMutation({
    onSuccess: () => utils.admin.products.list.invalidate(),
  });

  const update = trpc.admin.products.update.useMutation({
    onSuccess: () => utils.admin.products.list.invalidate(),
  });

  const remove = trpc.admin.products.remove.useMutation({
    onSuccess: () => utils.admin.products.list.invalidate(),
  });

  const uploadImage =
    trpc.admin.products.uploadImage.useMutation({
      onSuccess: () =>
        utils.admin.products.list.invalidate(),
    });

  const setCover =
    trpc.admin.products.setCover.useMutation({
      onSuccess: () =>
        utils.admin.products.list.invalidate(),
    });

  const removeImage =
    trpc.admin.products.removeImage.useMutation({
      onSuccess: () =>
        utils.admin.products.list.invalidate(),
    });

  const [form, setForm] =
    useState<ProductForm>(emptyProduct);

  const [editingId, setEditingId] =
    useState<number | string | null>(null);

  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const updateField = (
    field: keyof ProductForm,
    value: string | boolean,
  ) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  const edit = (
    product: NonNullable<
      typeof products.data
    >[number],
  ) => {
    setEditingId(product.id);
    setSelectedImage(null);
    setError("");

    setForm({
      categoryId: String(product.categoryId),
      name: product.name,
      slug: product.slug,
      sku: product.sku ?? "",
      details: product.details,
      fabric: product.fabric,
      color: product.color,
      priceTaka: String(product.priceTaka),
      oldPriceTaka: product.oldPriceTaka
        ? String(product.oldPriceTaka)
        : "",
      stockQuantity: String(product.stockQuantity),
      featured: product.featured,
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const product = editingId
        ? await update.mutateAsync({
            id: editingId,
            product: toProductInput(form),
          })
        : await create.mutateAsync(
            toProductInput(form),
          );

      if (selectedImage) {
        const dataUrl = await new Promise<string>(
          (resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () =>
              resolve(String(reader.result));

            reader.onerror = () =>
              reject(
                new Error("Image could not be read."),
              );

            reader.readAsDataURL(selectedImage);
          },
        );

        await uploadImage.mutateAsync({
          productId: product.id,
          dataUrl,
          fileName: selectedImage.name,
          altText: `${form.name} — Rabiora`,
          isCover:
            !editingId ||
            (products.data?.find(
              (item) => item.id === product.id,
            )?.images.length ?? 0) === 0,
        });
      }

      setEditingId(null);
      setForm(emptyProduct);
      setSelectedImage(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save the product.",
      );
    }
  };

  const editedProduct = editingId
    ? products.data?.find(
        (product) => product.id === editingId,
      )
    : null;

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Catalogue Management</p>
          <h1>Products</h1>
        </div>

        <button
          className="btn"
          onClick={() => {
            setEditingId(null);
            setForm(emptyProduct);
            setSelectedImage(null);
            setError("");
          }}
        >
          New Product
        </button>
      </section>

      <div className="admin-grid">
        <form
          className="admin-form"
          onSubmit={submit}
        >
          <h2>
            {editingId
              ? "Edit Product"
              : "Add Product"}
          </h2>

          <label>
            Category
            <select
              required
              value={form.categoryId}
              onChange={(event) =>
                updateField(
                  "categoryId",
                  event.target.value,
                )
              }
            >
              <option value="">
                Select category
              </option>

              {categories.data?.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Product Name
            <input
              required
              value={form.name}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            URL Slug
            <input
              required
              value={form.slug}
              onChange={(event) =>
                updateField(
                  "slug",
                  event.target.value,
                )
              }
              placeholder="premium-three-piece"
            />
          </label>

          <label>
            SKU
            <input
              value={form.sku}
              onChange={(event) =>
                updateField(
                  "sku",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Details
            <textarea
              required
              value={form.details}
              onChange={(event) =>
                updateField(
                  "details",
                  event.target.value,
                )
              }
            />
          </label>

          <div className="admin-field-pair">
            <label>
              Fabric
              <input
                required
                value={form.fabric}
                onChange={(event) =>
                  updateField(
                    "fabric",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Colour
              <input
                required
                value={form.color}
                onChange={(event) =>
                  updateField(
                    "color",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <div className="admin-field-pair">
            <label>
              Price (৳)
              <input
                required
                min="1"
                type="number"
                value={form.priceTaka}
                onChange={(event) =>
                  updateField(
                    "priceTaka",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Old Price (৳)
              <input
                min="1"
                type="number"
                value={form.oldPriceTaka}
                onChange={(event) =>
                  updateField(
                    "oldPriceTaka",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <label>
            Stock Quantity
            <input
              required
              min="0"
              type="number"
              value={form.stockQuantity}
              onChange={(event) =>
                updateField(
                  "stockQuantity",
                  event.target.value,
                )
              }
            />
          </label>

          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) =>
                updateField(
                  "featured",
                  event.target.checked,
                )
              }
            />

            Feature this product
          </label>

          <label>
            Cover or Gallery Image
            <input
              accept="image/jpeg,image/png,image/webp"
              type="file"
              onChange={(
                event: ChangeEvent<HTMLInputElement>,
              ) =>
                setSelectedImage(
                  event.target.files?.[0] ?? null,
                )
              }
            />
          </label>

          {editedProduct && (
            <div className="image-manager">
              <strong>Existing Images</strong>

              <div>
                {editedProduct.images.map((image) => (
                  <figure key={image.id}>
                    <img
                      src={image.storageUrl}
                      alt=""
                    />

                    <figcaption>
                      {image.isCover
                        ? "Cover"
                        : "Gallery"}
                    </figcaption>

                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setCover.mutate({
                            productId:
                              editedProduct.id,
                            imageId: image.id,
                          })
                        }
                      >
                        Set Cover
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Remove this image?",
                            )
                          ) {
                            removeImage.mutate({
                              productId:
                                editedProduct.id,
                              imageId: image.id,
                            });
                          }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </figure>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <div className="admin-actions">
            <button
              className="btn"
              disabled={
                create.isPending ||
                update.isPending ||
                uploadImage.isPending
              }
            >
              {editingId
                ? "Save Changes"
                : "Create Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyProduct);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="admin-list-card">
          <h2>
            Catalogue ({products.data?.length ?? 0})
          </h2>

          {products.isLoading ? (
            <p>Loading products...</p>
          ) : (
            <div className="admin-product-list">
              {products.data?.map((product) => (
                <article
                  key={product.id}
                  className="admin-product-row"
                >
                  <img
                    src={
                      product.images[0]?.storageUrl
                    }
                    alt=""
                  />

                  <div>
                    <strong>{product.name}</strong>
                    <small>
                      {product.categoryName} ·{" "}
                      {taka(product.priceTaka)} ·{" "}
                      {product.stockQuantity} in stock
                    </small>

                    <small>
                      {product.featured
                        ? "Featured"
                        : "Standard"}{" "}
                      · {product.images.length} images
                    </small>
                  </div>

                  <div className="row-actions">
                    <button
                      onClick={() =>
                        edit(product)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove ${product.name}?`,
                          )
                        ) {
                          remove.mutate({
                            id: product.id,
                          });
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CategoryManager() {
  const utils = trpc.useUtils();
  const categories = trpc.admin.categories.list.useQuery();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [error, setError] = useState("");

  const create = trpc.admin.categories.create.useMutation({
    onSuccess: () => {
      utils.admin.categories.list.invalidate();
      setName("");
      setSlug("");
      setError("");
    },
    onError: (err) => setError(err.message),
  });

  const update = trpc.admin.categories.update.useMutation({
    onSuccess: () => {
      utils.admin.categories.list.invalidate();
      setName("");
      setSlug("");
      setEditingId(null);
      setError("");
    },
    onError: (err) => setError(err.message),
  });

  const remove = trpc.admin.categories.remove.useMutation({
    onSuccess: () => {
      utils.admin.categories.list.invalidate();
      setError("");
    },
    onError: (err) => setError(err.message),
  });

  const startEdit = (cat: { id: string | number; name: string; slug: string }) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    if (editingId) {
      update.mutate({ id: editingId, category: { name: name.trim(), slug: slug.trim() || undefined } });
    } else {
      create.mutate({ name: name.trim(), slug: slug.trim() || undefined });
    }
  };

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Product Structure</p>
          <h1>Categories</h1>
        </div>
      </section>

      <div className="admin-grid">
        <form className="admin-card" onSubmit={submit}>
          <h3>{editingId ? "Edit Category" : "Add New Category"}</h3>

          {error && <div className="admin-error">{error}</div>}

          <div className="admin-field">
            <label>Category Name</label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g. Silk Collection"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingId) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                }
              }}
              required
            />
          </div>

          <div className="admin-field">
            <label>URL Slug</label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g. silk-collection"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div className="admin-actions">
            <button type="submit" className="btn" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? "Saving..." : editingId ? "Update Category" : "Create Category"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="admin-card">
          <h3>Existing Categories ({categories.data?.length || 0})</h3>
          {categories.isLoading ? (
            <p>Loading categories...</p>
          ) : categories.data?.length === 0 ? (
            <p>No categories found.</p>
          ) : (
            <div className="admin-product-list">
              {categories.data?.map((cat) => (
                <article key={cat.id} className="admin-product-item">
                  <div className="admin-product-item-details">
                    <h4>{cat.name}</h4>
                    <p className="slug">/{cat.slug}</p>
                  </div>
                  <div className="admin-product-item-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => startEdit(cat)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ background: "#dc2626", color: "#fff" }}
                      disabled={remove.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete category "${cat.name}"? Products will be reassigned.`)) {
                          remove.mutate({ id: cat.id });
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function OrderManager() {
  const utils = trpc.useUtils();
  const orders = trpc.admin.orders.list.useQuery();

  const advance =
    trpc.admin.orders.advanceStatus.useMutation({
      onSuccess: () =>
        utils.admin.orders.list.invalidate(),
    });

  const next: Record<
    string,
    "confirmed" | "shipped" | "delivered" | undefined
  > = {
    pending: "confirmed",
    confirmed: "shipped",
    shipped: "delivered",
    delivered: undefined,
  };

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Fulfilment Management</p>
          <h1>Orders</h1>
        </div>
      </section>

      <section className="admin-list-card">
        {orders.isLoading ? (
          <p>Loading orders...</p>
        ) : orders.data?.length === 0 ? (
          <p>No orders have been placed yet.</p>
        ) : (
          <div className="admin-order-list">
            {orders.data?.map((order) => (
              <article
                key={order.id}
                className="admin-order"
              >
                <div className="order-topline">
                  <div>
                    <strong>
                      {order.orderNumber}
                    </strong>

                    <small>
                      {new Date(
                        order.createdAt,
                      ).toLocaleString()}
                    </small>
                  </div>

                  <span
                    className={`status-pill status-${order.status}`}
                  >
                    {order.status}
                  </span>
                </div>

                <p>
                  <strong>
                    {order.customerName}
                  </strong>{" "}
                  · {order.customerPhone}
                </p>

                <p>
                  {order.districtArea},{" "}
                  {order.fullAddress}
                </p>

                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity} ×{" "}
                      {item.productName} —{" "}
                      {taka(item.lineTotalTaka)}
                    </li>
                  ))}
                </ul>

                <div className="order-payment">
                  <span>
                    {order.paymentMethod}
                  </span>

                  {order.payment && (
                    <span>
                      {order.payment.transactionId
                        ? `Txn: ${order.payment.transactionId}`
                        : "No transaction ID"}
                    </span>
                  )}

                  <strong>
                    {taka(order.totalTaka)}
                  </strong>
                </div>

                {next[order.status] && (
                  <button
                    className="btn"
                    disabled={advance.isPending}
                    onClick={() =>
                      advance.mutate({
                        orderId: order.id,
                        nextStatus:
                          next[order.status]!,
                      })
                    }
                  >
                    Mark as {next[order.status]}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ReviewManager() {
  const utils = trpc.useUtils();

  const reviews =
    trpc.admin.reviews.list.useQuery();

  const visibility =
    trpc.admin.reviews.setVisibility.useMutation({
      onSuccess: () =>
        utils.admin.reviews.list.invalidate(),
    });

  const remove =
    trpc.admin.reviews.remove.useMutation({
      onSuccess: () =>
        utils.admin.reviews.list.invalidate(),
    });

  const formatDate = (
    value?: string | Date | null,
  ) =>
    value
      ? new Date(value).toLocaleDateString(
          "en-BD",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          },
        )
      : "—";

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Customer Feedback</p>
          <h1>Reviews</h1>
        </div>

        <span className="status-pill status-confirmed">
          {reviews.data?.length ?? 0} Reviews
        </span>
      </section>

      <section className="admin-list-card">
        {reviews.isLoading ? (
          <p>Loading reviews...</p>
        ) : reviews.isError ? (
          <p className="form-error">
            Unable to load reviews.
          </p>
        ) : reviews.data?.length === 0 ? (
          <div className="reviews-empty">
            <h2>No reviews yet</h2>
            <p>
              Customer reviews will appear here after
              verified purchases.
            </p>
          </div>
        ) : (
          <div className="admin-review-list">
            {reviews.data?.map((review) => (
              <article
                key={review.id}
                className="admin-review-card"
              >
                <div className="admin-review-top">
                  <div>
                    <strong>
                      {review.productName}
                    </strong>

                    <small>
                      Review #{review.id} · Order #
                      {review.orderId}
                    </small>
                  </div>

                  <span
                    className={`status-pill ${
                      review.isVisible
                        ? "status-confirmed"
                        : "status-pending"
                    }`}
                  >
                    {review.isVisible
                      ? "Visible"
                      : "Hidden"}
                  </span>
                </div>

                <div className="admin-review-rating">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(
                    Math.max(
                      0,
                      5 - review.rating,
                    ),
                  )}
                </div>

                <p className="admin-review-text">
                  “{review.review}”
                </p>

                <div className="admin-review-meta">
                  <div>
                    <strong>
                      {review.customerName ||
                        "Unnamed Customer"}
                    </strong>

                    <span>
                      {review.customerPhone ||
                        "No phone number"}
                    </span>
                  </div>

                  <span>
                    {formatDate(review.createdAt)}
                  </span>
                </div>

                <div className="admin-review-actions">
                  <button
                    type="button"
                    disabled={
                      visibility.isPending
                    }
                    onClick={() =>
                      visibility.mutate({
                        reviewId: review.id,
                        isVisible:
                          !review.isVisible,
                      })
                    }
                  >
                    {review.isVisible
                      ? "Hide Review"
                      : "Show Review"}
                  </button>

                  <button
                    type="button"
                    className="danger"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Delete this review permanently?",
                        )
                      ) {
                        remove.mutate({
                          reviewId: review.id,
                        });
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminOverview() {
  const products =
    trpc.admin.products.list.useQuery();

  const orders =
    trpc.admin.orders.list.useQuery();

  const reviews =
    trpc.admin.reviews.list.useQuery();

  const counts = useMemo(
    () => ({
      products: products.data?.length ?? 0,
      orders: orders.data?.length ?? 0,
      pending:
        orders.data?.filter(
          (order) =>
            order.status === "pending",
        ).length ?? 0,
      reviews: reviews.data?.length ?? 0,
    }),
    [
      products.data,
      orders.data,
      reviews.data,
    ],
  );

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Rabiora Operations</p>
          <h1>Dashboard</h1>
        </div>

        <Link
          className="btn"
          href="/"
        >
          View Storefront
        </Link>
      </section>

      <div className="admin-metrics">
        <article>
          <span>Products</span>
          <strong>
            {counts.products}
          </strong>
        </article>

        <article>
          <span>Orders</span>
          <strong>
            {counts.orders}
          </strong>
        </article>

        <article>
          <span>Pending Orders</span>
          <strong>
            {counts.pending}
          </strong>
        </article>

        <article>
          <span>Reviews</span>
          <strong>
            {counts.reviews}
          </strong>
        </article>
      </div>

      <section className="admin-list-card">
        <h2>Administrator access</h2>

        <p>
          Manage the source-backed product catalogue,
          upload gallery images to managed storage,
          move customer orders through the fulfilment
          pipeline, and moderate customer reviews.
        </p>
      </section>
    </div>
  );
}

function CustomerManager() {
  const customers =
    trpc.admin.customers.list.useQuery();

  const formatDate = (
    value?: string | Date | null,
  ) =>
    value
      ? new Date(value).toLocaleDateString(
          "en-BD",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          },
        )
      : "—";

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Customer Management</p>
          <h1>Customers</h1>
        </div>
      </section>

      <section className="admin-list-card">
        {customers.isLoading ? (
          <p>Loading customers...</p>
        ) : customers.data?.length === 0 ? (
          <p>No customers found.</p>
        ) : (
          <div className="admin-customer-table-wrap">
            <table className="admin-customer-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Total Orders</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {customers.data?.map(
                  (customer) => (
                    <tr key={customer.id}>
                      <td>
                        #{customer.id}
                      </td>

                      <td>
                        {customer.name ||
                          "Unnamed"}
                      </td>

                      <td>
                        {customer.email || "—"}
                      </td>

                      <td>
                        {customer.phone || "—"}
                      </td>

                      <td>
                        <span
                          className={`status-pill ${
                            customer.role ===
                            "admin"
                              ? "status-confirmed"
                              : "status-pending"
                          }`}
                        >
                          {customer.role ===
                          "admin"
                            ? "Admin"
                            : "Customer"}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          customer.createdAt,
                        )}
                      </td>

                      <td>
                        {customer.totalOrders}
                      </td>

                      <td>
                        <Link
                          className="btn btn-small"
                          href={`/admin/customers/${customer.id}`}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function CustomerDetailManager() {
  const [, params] = useRoute(
    "/admin/customers/:id",
  );

  const customerId = Number(params?.id);

  const customer =
    trpc.admin.customers.detail.useQuery(
      { id: customerId },
      {
        enabled:
          Number.isInteger(customerId) &&
          customerId > 0,
      },
    );

  const formatDate = (
    value?: string | Date | null,
  ) =>
    value
      ? new Date(value).toLocaleDateString(
          "en-BD",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          },
        )
      : "—";

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Customer Management</p>
          <h1>Customer Details</h1>
        </div>

        <Link
          className="btn"
          href="/admin/customers"
        >
          Back to Customers
        </Link>
      </section>

      {customer.isLoading ? (
        <section className="admin-list-card">
          <p>
            Loading customer details...
          </p>
        </section>
      ) : !customer.data ? (
        <section className="admin-list-card">
          <p>Customer not found.</p>
        </section>
      ) : (
        <div className="admin-grid">
          <section className="admin-form">
            <h2>Profile</h2>

            <div className="admin-detail-list">
              <div>
                <span>ID</span>
                <strong>
                  #{customer.data.id}
                </strong>
              </div>

              <div>
                <span>Name</span>
                <strong>
                  {customer.data.name ||
                    "Unnamed"}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {customer.data.email || "—"}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>
                  {customer.data.phone || "—"}
                </strong>
              </div>

              <div>
                <span>Role</span>
                <strong>
                  {customer.data.role ===
                  "admin"
                    ? "Admin"
                    : "Customer"}
                </strong>
              </div>

              <div>
                <span>Created</span>
                <strong>
                  {formatDate(
                    customer.data.createdAt,
                  )}
                </strong>
              </div>
            </div>
          </section>

          <section className="admin-list-card">
            <h2>Order History</h2>

            {customer.data.orders.length ===
            0 ? (
              <p>
                No orders found for this
                customer.
              </p>
            ) : (
              <div className="admin-order-list">
                {customer.data.orders.map(
                  (order) => (
                    <article
                      key={order.id}
                      className="admin-order"
                    >
                      <div className="order-topline">
                        <div>
                          <strong>
                            {
                              order.orderNumber
                            }
                          </strong>

                          <small>
                            {formatDate(
                              order.createdAt,
                            )}
                          </small>
                        </div>

                        <span
                          className={`status-pill status-${order.status}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <p>
                        <strong>
                          {
                            order.customerName
                          }
                        </strong>{" "}
                        ·{" "}
                        {
                          order.customerPhone
                        }
                      </p>

                      <p>
                        {
                          order.districtArea
                        }
                        ,{" "}
                        {order.fullAddress}
                      </p>

                      <div className="order-payment">
                        <span>
                          {
                            order.paymentMethod
                          }
                        </span>

                        <strong>
                          {taka(
                            order.totalTaka,
                          )}
                        </strong>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [location] =
    useLocation();

  const [matchCustomerDetail] =
    useRoute(
      "/admin/customers/:id",
    );

  const { user, loading } =
    useAuth();

  if (loading) {
    return (
      <div className="admin-forbidden">
        Checking administrator access...
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-forbidden">
        <h1>
          Administrator access required
        </h1>

        <p>
          {!user
            ? "Please sign in with your administrator credentials to access Rabiora operations."
            : "Your account is signed in but does not have administrator privileges."}
        </p>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "center" }}>
          {!user && (
            <Link
              href="/login"
              className="btn"
            >
              Sign In as Admin
            </Link>
          )}
          <Link
            href="/"
            className="btn-outline"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  const page =
    matchCustomerDetail
      ? <CustomerDetailManager />
      : location ===
        "/admin/products"
        ? <ProductManager />
        : location ===
          "/admin/categories"
          ? <CategoryManager />
        : location ===
          "/admin/orders"
          ? <OrderManager />
        : location ===
          "/admin/customers"
          ? <CustomerManager />
        : location ===
          "/admin/reviews"
          ? <ReviewManager />
        : <AdminOverview />;

  return (
  <DashboardLayout>
    <div className="admin-page">
      {page}
    </div>
  </DashboardLayout>
);
}