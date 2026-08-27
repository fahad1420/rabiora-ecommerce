import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
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

  const advance = trpc.admin.orders.advanceStatus.useMutation({
    onSuccess: () => utils.admin.orders.list.invalidate(),
  });

  const next: Record<string, "confirmed" | "shipped" | "delivered" | undefined> = {
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
              <article key={order.id} className="admin-order">
                <div className="order-topline">
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <small>{new Date(order.createdAt).toLocaleString("en-BD")}</small>
                  </div>

                  <span className={`status-pill status-${order.status}`}>{order.status}</span>
                </div>

                <p>
                  <strong>{order.customerName}</strong> · {order.customerPhone}
                </p>

                <p>
                  {order.districtArea}, {order.fullAddress}
                </p>

                <div className="admin-order-items-grid">
                  {order.items.map((item) => (
                    <div className="admin-order-item-card" key={item.id}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="admin-order-item-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="admin-order-item-fallback">👗</div>
                      )}
                      <div className="admin-order-item-info">
                        <strong>{item.productName}</strong>
                        {item.sku && <small className="sku-tag">SKU: {item.sku}</small>}
                        <span>
                          {item.quantity} × {taka(item.unitPriceTaka)} = <strong>{taka(item.lineTotalTaka)}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-payment">
                  <span>Method: <strong>{order.paymentMethod}</strong></span>

                  {order.payment && (
                    <span>
                      {order.payment.transactionId
                        ? `TrxID: ${order.payment.transactionId} (Paid: ${taka(order.payment.submittedAmountTaka || 0)})`
                        : "No TrxID (COD)"}
                    </span>
                  )}

                  <strong>Total: {taka(order.totalTaka)}</strong>
                </div>

                {next[order.status] && (
                  <button
                    className="btn"
                    disabled={advance.isPending}
                    onClick={() =>
                      advance.mutate({
                        orderId: order.id,
                        nextStatus: next[order.status]!,
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

function PaymentSettingsManager() {
  const utils = trpc.useUtils();
  const settings = trpc.settings.get.useQuery();
  const updateSettings = trpc.admin.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      setSavedStatus("Payment & Hero settings updated successfully!");
      setTimeout(() => setSavedStatus(""), 4000);
    },
  });

  const [bkashNumber, setBkashNumber] = useState("+8801349529274");
  const [nagadNumber, setNagadNumber] = useState("+8801349529274");
  const [rocketNumber, setRocketNumber] = useState("+8801349529274");
  const [heroBadge, setHeroBadge] = useState("Premium Collection");
  const [heroHeading, setHeroHeading] = useState("RABIORA");
  const [heroTagline, setHeroTagline] = useState("Elegance • Comfort • Confidence");
  const [savedStatus, setSavedStatus] = useState("");

  useEffect(() => {
    if (settings.data) {
      setBkashNumber(settings.data.bkashNumber || "+8801349529274");
      setNagadNumber(settings.data.nagadNumber || "+8801349529274");
      setRocketNumber(settings.data.rocketNumber || "+8801349529274");
      setHeroBadge(settings.data.heroBadge || "Premium Collection");
      setHeroHeading(settings.data.heroHeading || "RABIORA");
      setHeroTagline(settings.data.heroTagline || "Elegance • Comfort • Confidence");
    }
  }, [settings.data]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      bkashNumber,
      nagadNumber,
      rocketNumber,
      heroBadge,
      heroHeading,
      heroTagline,
    });
  };

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>System Configuration</p>
          <h1>Payment & Site Settings</h1>
        </div>
      </section>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>Payment Wallet Numbers</h2>
        <p className="muted">These numbers are displayed live at checkout for customer transfers.</p>

        <div className="admin-field-pair">
          <label>
            bKash Number (Personal/Merchant)
            <input
              required
              value={bkashNumber}
              onChange={(e) => setBkashNumber(e.target.value)}
              placeholder="+8801XXXXXXXXX"
            />
          </label>

          <label>
            Nagad Number
            <input
              required
              value={nagadNumber}
              onChange={(e) => setNagadNumber(e.target.value)}
              placeholder="+8801XXXXXXXXX"
            />
          </label>
        </div>

        <label>
          Rocket Number
          <input
            required
            value={rocketNumber}
            onChange={(e) => setRocketNumber(e.target.value)}
            placeholder="+8801XXXXXXXXX"
          />
        </label>

        <h2 style={{ marginTop: "1rem" }}>Hero Brand Messaging</h2>

        <div className="admin-field-pair">
          <label>
            Hero Badge
            <input
              value={heroBadge}
              onChange={(e) => setHeroBadge(e.target.value)}
              placeholder="Premium Collection"
            />
          </label>

          <label>
            Hero Brand Heading
            <input
              value={heroHeading}
              onChange={(e) => setHeroHeading(e.target.value)}
              placeholder="RABIORA"
            />
          </label>
        </div>

        <label>
          Hero Tagline
          <input
            value={heroTagline}
            onChange={(e) => setHeroTagline(e.target.value)}
            placeholder="Elegance • Comfort • Confidence"
          />
        </label>

        {savedStatus && <p className="form-success" role="status">{savedStatus}</p>}

        <button className="btn" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? "Saving Settings..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}

function OfferBannersManager() {
  const utils = trpc.useUtils();
  const offers = trpc.admin.offers.list.useQuery();

  const create = trpc.admin.offers.create.useMutation({
    onSuccess: () => {
      utils.admin.offers.list.invalidate();
      utils.offers.list.invalidate();
      resetForm();
    },
  });

  const update = trpc.admin.offers.update.useMutation({
    onSuccess: () => {
      utils.admin.offers.list.invalidate();
      utils.offers.list.invalidate();
      resetForm();
    },
  });

  const remove = trpc.admin.offers.delete.useMutation({
    onSuccess: () => {
      utils.admin.offers.list.invalidate();
      utils.offers.list.invalidate();
    },
  });

  const uploadImage = trpc.admin.offers.uploadImage.useMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [offerType, setOfferType] = useState<"text" | "image_banner">("image_banner");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badge, setBadge] = useState("Special Offer");
  const [discountCode, setDiscountCode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("/#products");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setOfferType("image_banner");
    setTitle("");
    setSubtitle("");
    setBadge("Special Offer");
    setDiscountCode("");
    setImageUrl("");
    setLinkUrl("/#products");
    setIsActive(true);
    setDisplayOrder(0);
    setIsUploading(false);
    setUploadError("");
  };

  const handleEdit = (banner: any) => {
    setEditingId(banner.id);
    setOfferType(banner.offerType || "text");
    setTitle(banner.title);
    setSubtitle(banner.subtitle || "");
    setBadge(banner.badge || "Special Offer");
    setDiscountCode(banner.discountCode || "");
    setImageUrl(banner.imageUrl || "");
    setLinkUrl(banner.linkUrl || "/#products");
    setIsActive(banner.isActive);
    setDisplayOrder(banner.displayOrder || 0);
    setIsUploading(false);
    setUploadError("");
  };

  const handleImageFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError("");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUri = reader.result as string;
        const uploaded = await uploadImage.mutateAsync({ dataUri, fileName: file.name });
        setImageUrl(uploaded.storageUrl);
      } catch (err: any) {
        setUploadError(err.message || "Failed to upload image.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError("Could not read local file.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (offerType === "image_banner" && !imageUrl.trim()) {
      alert("Please upload or provide an image for the Image Banner offer.");
      return;
    }

    if (editingId) {
      update.mutate({
        id: editingId,
        offerType,
        title,
        subtitle: offerType === "text" ? subtitle : "",
        badge: offerType === "text" ? badge : "",
        discountCode: offerType === "text" ? discountCode : "",
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim() || "/#products",
        isActive,
        displayOrder,
      });
    } else {
      create.mutate({
        offerType,
        title,
        subtitle: offerType === "text" ? subtitle : "",
        badge: offerType === "text" ? badge : "",
        discountCode: offerType === "text" ? discountCode : "",
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim() || "/#products",
        isActive,
        displayOrder,
      });
    }
  };

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Storefront Promotions</p>
          <h1>Special Offers & Banners</h1>
        </div>
      </section>

      <div className="admin-grid">
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit Special Offer" : "New Special Offer"}</h2>

          {/* Offer Type Selector */}
          <label>
            Offer Format Type
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "6px" }}>
              <button
                type="button"
                className={offerType === "image_banner" ? "btn" : "btn-outline"}
                style={{ padding: "10px", fontSize: "13px", fontWeight: "700" }}
                onClick={() => setOfferType("image_banner")}
              >
                🖼️ Image Banner
              </button>
              <button
                type="button"
                className={offerType === "text" ? "btn" : "btn-outline"}
                style={{ padding: "10px", fontSize: "13px", fontWeight: "700" }}
                onClick={() => setOfferType("text")}
              >
                📝 Text Offer
              </button>
            </div>
            <small style={{ display: "block", marginTop: "4px", color: "var(--gray)" }}>
              {offerType === "image_banner"
                ? "Uploads one complete banner image with all graphics/text built in. No text overlays shown on homepage."
                : "Creates a styled text offer box. Image is optional and no placeholder is forced."}
            </small>
          </label>

          <label>
            {offerType === "image_banner" ? "Banner Name / Alt Label" : "Offer Title"}
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={offerType === "image_banner" ? "e.g., Eid Mega Discount Banner" : "e.g., 10% OFF on bKash Payment"}
            />
          </label>

          {offerType === "text" && (
            <>
              <label>
                Subtitle / Description
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Exclusive Rabiora Pakistani Three-Piece Discount"
                />
              </label>

              <div className="admin-field-pair">
                <label>
                  Badge Text
                  <input
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Special Offer"
                  />
                </label>

                <label>
                  Discount Coupon Code
                  <input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="BKASH10"
                  />
                </label>
              </div>
            </>
          )}

          {/* Banner Image Upload */}
          <label>
            {offerType === "image_banner" ? "Full Banner Image (Required)" : "Side Image (Optional for Text Offer)"}
            <input type="file" accept="image/*" onChange={handleImageFile} disabled={isUploading} />
            {isUploading && <small style={{ color: "var(--primary)" }}>Uploading image to storage...</small>}
            {uploadError && <small style={{ color: "var(--sale)" }}>{uploadError}</small>}
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/..."
              style={{ marginTop: "6px" }}
              required={offerType === "image_banner"}
            />
          </label>

          {imageUrl && (
            <div style={{ margin: "10px 0", display: "flex", alignItems: "center", gap: "12px", background: "var(--soft-bg)", padding: "10px", borderRadius: "10px" }}>
              <img
                src={imageUrl}
                alt="Banner Preview"
                style={{
                  width: offerType === "image_banner" ? "120px" : "70px",
                  height: "70px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  background: "#fff",
                  border: "1px solid var(--border)",
                }}
              />
              <div style={{ flex: 1 }}>
                <strong style={{ color: "var(--primary)", fontSize: "13px" }}>✓ Image Ready & Saved</strong>
                <p style={{ margin: "2px 0 4px", fontSize: "11px", color: "var(--gray)", wordBreak: "break-all" }}>{imageUrl}</p>
                <button
                  type="button"
                  style={{ background: "none", border: 0, padding: 0, color: "var(--sale)", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => setImageUrl("")}
                >
                  Remove Image
                </button>
              </div>
            </div>
          )}

          <div className="admin-field-pair">
            <label>
              Link URL (Click Destination)
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/#products"
              />
            </label>

            <label>
              Sort Order
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
              />
            </label>
          </div>

          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Active on Storefront</span>
          </label>

          <div className="admin-actions">
            <button className="btn" disabled={isUploading || create.isPending || update.isPending}>
              {editingId ? "Update Offer" : "Create Offer"}
            </button>
            {editingId && (
              <button type="button" className="btn-outline" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="admin-list-card">
          <h2>Active & Configured Offers ({offers.data?.length ?? 0})</h2>
          {offers.isLoading ? (
            <p>Loading offers...</p>
          ) : offers.data?.length === 0 ? (
            <p>No offer banners created yet.</p>
          ) : (
            <div className="admin-product-list">
              {offers.data?.map((banner) => (
                <article key={banner.id} className="admin-product-row">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      style={{ width: "70px", height: "64px", objectFit: "contain", background: "#f8fafc", borderRadius: "8px", padding: "2px" }}
                    />
                  ) : (
                    <div style={{ width: "70px", height: "64px", display: "grid", placeItems: "center", background: "#f1f5f9", borderRadius: "8px", fontSize: "20px" }}>
                      📝
                    </div>
                  )}
                  <div>
                    <strong>{banner.title}</strong>
                    <div style={{ margin: "3px 0", display: "flex", gap: "6px", alignItems: "center" }}>
                      <span className="status-pill status-confirmed" style={{ fontSize: "10px", padding: "2px 8px" }}>
                        {banner.offerType === "image_banner" ? "🖼️ Image Banner" : "📝 Text Offer"}
                      </span>
                      <span className={`status-pill ${banner.isActive ? "status-confirmed" : "status-pending"}`} style={{ fontSize: "10px", padding: "2px 8px" }}>
                        {banner.isActive ? "Active" : "Hidden"}
                      </span>
                    </div>
                    {banner.subtitle && <p style={{ margin: "2px 0", fontSize: "12px" }}>{banner.subtitle}</p>}
                    <small>
                      {banner.badge ? `Badge: ${banner.badge} • ` : ""}{banner.discountCode ? `Code: ${banner.discountCode} • ` : ""}Order: {banner.displayOrder}
                    </small>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      onClick={() => {
                        update.mutate({
                          id: banner.id,
                          isActive: !banner.isActive,
                        });
                      }}
                      title={banner.isActive ? "Hide from Storefront" : "Show on Storefront"}
                    >
                      {banner.isActive ? "Hide" : "Activate"}
                    </button>
                    <button type="button" onClick={() => handleEdit(banner)}>Edit</button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        if (window.confirm(`Delete offer "${banner.title}"?`)) {
                          remove.mutate({ id: banner.id });
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

function SubscribersManager() {
  const utils = trpc.useUtils();
  const subscribers = trpc.admin.subscribers.list.useQuery();
  const remove = trpc.admin.subscribers.delete.useMutation({
    onSuccess: () => utils.admin.subscribers.list.invalidate(),
  });

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Audience Management</p>
          <h1>Newsletter Subscribers</h1>
        </div>
        <span className="status-pill status-confirmed">
          {subscribers.data?.length ?? 0} Subscribers
        </span>
      </section>

      <section className="admin-list-card">
        {subscribers.isLoading ? (
          <p>Loading subscribers...</p>
        ) : subscribers.data?.length === 0 ? (
          <p>No subscribers have signed up yet.</p>
        ) : (
          <div className="admin-order-list">
            {subscribers.data?.map((sub) => (
              <article key={sub.id} className="admin-order">
                <div className="order-topline">
                  <div>
                    <strong>{sub.email}</strong>
                    <small>Subscribed: {new Date(sub.createdAt).toLocaleDateString("en-BD")}</small>
                  </div>
                  <span className="status-pill status-confirmed">
                    {sub.residency === "inside_bangladesh" ? "🇧🇩 Bangladesh" : "🌍 International"}
                  </span>
                </div>
                <p><strong>Mobile:</strong> {sub.phone}</p>
                <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      if (window.confirm(`Remove subscriber ${sub.email}?`)) {
                        remove.mutate({ id: sub.id });
                      }
                    }}
                  >
                    Remove
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

export default function Admin() {
  const [location] = useLocation();
  const [matchCustomerDetail] = useRoute("/admin/customers/:id");
  const { user, loading } = useAuth();

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
        <h1>Administrator access required</h1>
        <p>
          {!user
            ? "Please sign in with your administrator credentials to access Rabiora operations."
            : "Your account is signed in but does not have administrator privileges."}
        </p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "center" }}>
          {!user && (
            <Link href="/login" className="btn">
              Sign In as Admin
            </Link>
          )}
          <Link href="/" className="btn-outline">
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  const page = matchCustomerDetail ? (
    <CustomerDetailManager />
  ) : location === "/admin/products" ? (
    <ProductManager />
  ) : location === "/admin/categories" ? (
    <CategoryManager />
  ) : location === "/admin/orders" ? (
    <OrderManager />
  ) : location === "/admin/customers" ? (
    <CustomerManager />
  ) : location === "/admin/reviews" ? (
    <ReviewManager />
  ) : location === "/admin/offers" ? (
    <OfferBannersManager />
  ) : location === "/admin/subscribers" ? (
    <SubscribersManager />
  ) : location === "/admin/settings" ? (
    <PaymentSettingsManager />
  ) : (
    <AdminOverview />
  );

  return (
    <DashboardLayout>
      <div className="admin-page">{page}</div>
    </DashboardLayout>
  );
}