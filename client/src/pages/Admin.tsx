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

  const uploadMultipleImages =
    trpc.admin.products.uploadMultipleImages.useMutation({
      onSuccess: () =>
        utils.admin.products.list.invalidate(),
    });

  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [error, setError] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

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
    setSelectedImages([]);
    setError("");
    setUploadProgressText("");

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

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(`Failed to read image: ${file.name}`));
      reader.readAsDataURL(file);
    });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setUploadProgressText("");

    try {
      const product = editingId
        ? await update.mutateAsync({
            id: editingId,
            product: toProductInput(form),
          })
        : await create.mutateAsync(
            toProductInput(form),
          );

      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
        const existingImageCount =
          products.data?.find((item) => String(item.id) === String(product.id))?.images.length ?? 0;

        const failedUploads: string[] = [];

        for (let idx = 0; idx < selectedImages.length; idx++) {
          const file = selectedImages[idx];
          setUploadProgressText(`Uploading image ${idx + 1} of ${selectedImages.length}: ${file.name}...`);
          try {
            const dataUrl = await fileToDataUrl(file);
            await uploadImage.mutateAsync({
              productId: product.id,
              dataUrl,
              fileName: file.name,
              altText: `${form.name} — Rabiora`,
              isCover: existingImageCount === 0 && idx === 0,
            });
          } catch (fileErr: any) {
            console.error(`Failed to upload image ${file.name}:`, fileErr);
            failedUploads.push(file.name);
          }
        }

        await utils.admin.products.list.invalidate();

        if (failedUploads.length > 0) {
          setError(`Product saved, but ${failedUploads.length} image(s) failed: ${failedUploads.join(", ")}`);
        }
      }

      setEditingId(null);
      setForm(emptyProduct);
      setSelectedImages([]);
      setUploadProgressText("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save the product.",
      );
    } finally {
      setIsUploadingImages(false);
      setUploadProgressText("");
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
            setSelectedImages([]);
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
            Upload Product Images (Single or Multiple)
            <input
              accept="image/jpeg,image/png,image/webp"
              type="file"
              multiple
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                if (event.target.files) {
                  setSelectedImages(Array.from(event.target.files));
                }
              }}
            />
            {selectedImages.length > 0 && (
              <span className="selected-files-note" style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "#16a34a" }}>
                ✓ {selectedImages.length} image{selectedImages.length > 1 ? "s" : ""} selected for upload: {selectedImages.map((f) => f.name).join(", ")}
              </span>
            )}
            {isUploadingImages && (
              <div className="upload-progress-banner" style={{ padding: "8px 12px", background: "rgba(24, 168, 158, 0.12)", border: "1px solid #18A89E", borderRadius: "8px", color: "#18A89E", fontSize: "13px", fontWeight: 600, marginTop: "8px" }}>
                ⏳ {uploadProgressText || "Uploading images, please wait..."}
              </div>
            )}
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
            <p className="admin-loading-text">Loading categories...</p>
          ) : categories.data?.length === 0 ? (
            <p className="admin-empty-text">No categories found.</p>
          ) : (
            <div className="admin-category-list">
              {categories.data?.map((cat) => (
                <article key={cat.id} className="admin-category-card">
                  <div className="admin-category-info">
                    <h4 className="admin-category-title">{cat.name}</h4>
                    <p className="admin-category-slug">/{cat.slug}</p>
                  </div>
                  <div className="admin-category-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(cat)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-action btn-sm"
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
          <p className="admin-loading-text">Loading orders...</p>
        ) : orders.data?.length === 0 ? (
          <p className="admin-empty-text">No orders have been placed yet.</p>
        ) : (
          <div className="admin-order-list">
            {orders.data?.map((order) => (
              <article key={order.id} className="admin-order-card">
                <div className="admin-order-card-header">
                  <div className="admin-order-id-group">
                    <strong className="admin-order-number">{order.orderNumber}</strong>
                    <small className="admin-order-date">{new Date(order.createdAt).toLocaleString("en-BD")}</small>
                  </div>
                  <span className={`status-pill status-${order.status}`}>{order.status}</span>
                </div>

                <div className="admin-order-customer-info">
                  <p className="admin-order-customer-name">
                    <strong>{order.customerName}</strong> · <a href={`tel:${order.customerPhone}`} className="admin-order-phone">{order.customerPhone}</a>
                  </p>
                  <p className="admin-order-address">
                    📍 {order.districtArea}, {order.fullAddress}
                  </p>
                </div>

                <div className="admin-order-items-container">
                  {order.items.map((item) => (
                    <div className="admin-order-item-row" key={item.id}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="admin-order-item-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="admin-order-item-thumb-fallback">👗</div>
                      )}
                      <div className="admin-order-item-details">
                        <span className="admin-order-item-name">{item.productName}</span>
                        {item.sku && <small className="admin-order-item-sku">SKU: {item.sku}</small>}
                        <span className="admin-order-item-calc">
                          {item.quantity} × {taka(item.unitPriceTaka)} = <strong>{taka(item.lineTotalTaka)}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="admin-order-summary-bar">
                  <div className="admin-order-payment-meta">
                    <span>Payment: <strong>{order.paymentMethod}</strong></span>
                    {(order as any).couponCode && (
                      <span className="admin-coupon-applied-tag">
                        🏷️ Coupon: <strong>{(order as any).couponCode}</strong> (-{(order as any).discountPercent}%, -{taka((order as any).discountAmountTaka || 0)})
                      </span>
                    )}
                    {order.payment && (
                      <span className="admin-order-trxid">
                        {order.payment.transactionId
                          ? `TrxID: ${order.payment.transactionId} (Paid: ${taka(order.payment.submittedAmountTaka || 0)})`
                          : "No TrxID (COD)"}
                      </span>
                    )}
                  </div>
                  <div className="admin-order-total-group">
                    <strong className="admin-order-total-amount">
                      {(order as any).couponCode && (order as any).originalSubtotalTaka
                        ? `Payable: ${taka(order.totalTaka)} (Subtotal: ${taka((order as any).originalSubtotalTaka)})`
                        : `Total: ${taka(order.totalTaka)}`}
                    </strong>
                  </div>
                </div>

                {next[order.status] && (
                  <div className="admin-order-actions-bar">
                    <button
                      className="btn btn-gold-action"
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
                  </div>
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
          <p className="admin-loading-text">Loading customers...</p>
        ) : customers.data?.length === 0 ? (
          <p className="admin-empty-text">No customers found.</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="admin-customer-table-desktop admin-customer-table-wrap">
              <table className="admin-customer-table admin-table">
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
                  {customers.data?.map((customer) => (
                    <tr key={customer.id}>
                      <td className="admin-cell-id">#{customer.id}</td>
                      <td className="admin-cell-name"><strong>{customer.name || "Unnamed"}</strong></td>
                      <td className="admin-cell-email">{customer.email || "—"}</td>
                      <td className="admin-cell-phone">{customer.phone || "—"}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            customer.role === "admin"
                              ? "status-confirmed"
                              : "status-pending"
                          }`}
                        >
                          {customer.role === "admin" ? "Admin" : "Customer"}
                        </span>
                      </td>
                      <td>{formatDate(customer.createdAt)}</td>
                      <td><strong>{customer.totalOrders}</strong></td>
                      <td>
                        <Link
                          className="btn btn-secondary btn-sm"
                          href={`/admin/customers/${customer.id}`}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="admin-customer-cards-mobile">
              {customers.data?.map((customer) => (
                <article key={customer.id} className="admin-customer-mobile-card">
                  <div className="admin-customer-mobile-header">
                    <div>
                      <span className="admin-customer-mobile-id">#{customer.id}</span>
                      <h4 className="admin-customer-mobile-name">{customer.name || "Unnamed"}</h4>
                    </div>
                    <span
                      className={`status-pill ${
                        customer.role === "admin"
                          ? "status-confirmed"
                          : "status-pending"
                      }`}
                    >
                      {customer.role === "admin" ? "Admin" : "Customer"}
                    </span>
                  </div>

                  <div className="admin-customer-mobile-details">
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Email:</span>
                      <span className="admin-detail-value admin-break-all">{customer.email || "—"}</span>
                    </div>
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Phone:</span>
                      <span className="admin-detail-value">{customer.phone || "—"}</span>
                    </div>
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Joined:</span>
                      <span className="admin-detail-value">{formatDate(customer.createdAt)}</span>
                    </div>
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Orders:</span>
                      <span className="admin-detail-value font-semibold">{customer.totalOrders}</span>
                    </div>
                  </div>

                  <div className="admin-customer-mobile-actions">
                    <Link
                      className="btn btn-block btn-secondary btn-sm"
                      href={`/admin/customers/${customer.id}`}
                    >
                      View Customer Details →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function CustomerDetailManager() {
  const [, params] = useRoute(
    "/admin/customers/:id",
  );

  const customerId = params?.id ? decodeURIComponent(params.id) : "";

  const customer =
    trpc.admin.customers.detail.useQuery(
      { id: customerId },
      {
        enabled: Boolean(customerId),
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
          <p className="admin-loading-text">Loading customer details...</p>
        </section>
      ) : !customer.data ? (
        <section className="admin-list-card">
          <p className="admin-empty-text">Customer not found.</p>
        </section>
      ) : (
        <div className="admin-grid">
          <section className="admin-card">
            <h2 style={{ marginBottom: "16px" }}>Customer Profile</h2>

            <div className="admin-detail-list">
              <div className="admin-detail-row">
                <span className="admin-detail-label">Customer ID</span>
                <strong className="admin-detail-value admin-break-all">
                  #{customer.data.id}
                </strong>
              </div>

              <div className="admin-detail-row">
                <span className="admin-detail-label">Name</span>
                <strong className="admin-detail-value">
                  {customer.data.name || "Unnamed"}
                </strong>
              </div>

              <div className="admin-detail-row">
                <span className="admin-detail-label">Email</span>
                <strong className="admin-detail-value admin-break-all">
                  {customer.data.email || "—"}
                </strong>
              </div>

              <div className="admin-detail-row">
                <span className="admin-detail-label">Phone</span>
                <strong className="admin-detail-value">
                  {customer.data.phone || "—"}
                </strong>
              </div>

              <div className="admin-detail-row">
                <span className="admin-detail-label">Account Role</span>
                <span className={`status-pill ${customer.data.role === "admin" ? "status-confirmed" : "status-pending"}`}>
                  {customer.data.role === "admin" ? "Admin" : "Customer"}
                </span>
              </div>

              <div className="admin-detail-row">
                <span className="admin-detail-label">Member Since</span>
                <strong className="admin-detail-value">
                  {formatDate(customer.data.createdAt)}
                </strong>
              </div>
            </div>
          </section>

          <section className="admin-list-card">
            <h2 style={{ marginBottom: "16px" }}>Order History ({customer.data.orders.length})</h2>

            {customer.data.orders.length === 0 ? (
              <p className="admin-empty-text">No orders found for this customer.</p>
            ) : (
              <div className="admin-order-list">
                {customer.data.orders.map((order) => (
                  <article key={order.id} className="admin-order-card">
                    <div className="admin-order-card-header">
                      <div className="admin-order-id-group">
                        <strong className="admin-order-number">{order.orderNumber}</strong>
                        <small className="admin-order-date">{formatDate(order.createdAt)}</small>
                      </div>
                      <span className={`status-pill status-${order.status}`}>{order.status}</span>
                    </div>

                    <div className="admin-order-customer-info">
                      <p className="admin-order-customer-name">
                        <strong>{order.customerName}</strong> · {order.customerPhone}
                      </p>
                      <p className="admin-order-address">
                        📍 {order.districtArea}, {order.fullAddress}
                      </p>
                    </div>

                    <div className="admin-order-summary-bar">
                      <div className="admin-order-payment-meta">
                        <span>Payment: <strong>{order.paymentMethod}</strong></span>
                      </div>
                      <div className="admin-order-total-group">
                        <strong className="admin-order-total-amount">{taka(order.totalTaka)}</strong>
                      </div>
                    </div>
                  </article>
                ))}
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
  const products = trpc.admin.products.list.useQuery();
  const updateSettings = trpc.admin.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      setSavedStatus("Payment, Delivery & Site settings updated successfully!");
      setTimeout(() => setSavedStatus(""), 4000);
    },
  });

  const [bkashNumber, setBkashNumber] = useState("+8801349529274");
  const [nagadNumber, setNagadNumber] = useState("+8801349529274");
  const [rocketNumber, setRocketNumber] = useState("+8801349529274");
  const [deliveryChargeDhaka, setDeliveryChargeDhaka] = useState("0");
  const [deliveryChargeOutsideDhaka, setDeliveryChargeOutsideDhaka] = useState("120");
  const [featuredPictureUrl, setFeaturedPictureUrl] = useState("");
  const [featuredTitle, setFeaturedTitle] = useState("");
  const [featuredPictureLink, setFeaturedPictureLink] = useState("");
  const [featuredProductId, setFeaturedProductId] = useState("");
  const [heroBadge, setHeroBadge] = useState("Premium Collection");
  const [heroHeading, setHeroHeading] = useState("RABIORA");
  const [heroTagline, setHeroTagline] = useState("Elegance • Comfort • Confidence");

  // Promotional Discount & Countdown Bar State
  const [promoActive, setPromoActive] = useState(false);
  const [promoText, setPromoText] = useState("Flash Sale — Special Discount on Authentic Pakistani Lawn & Silk!");
  const [promoDiscountText, setPromoDiscountText] = useState("10% OFF");
  const [promoCountdownEnd, setPromoCountdownEnd] = useState("");
  const [promoCountdownActive, setPromoCountdownActive] = useState(true);
  const [promoButtonText, setPromoButtonText] = useState("Shop Sale");
  const [promoLink, setPromoLink] = useState("/#products");

  const [savedStatus, setSavedStatus] = useState("");

  useEffect(() => {
    if (settings.data) {
      setBkashNumber(settings.data.bkashNumber || "+8801349529274");
      setNagadNumber(settings.data.nagadNumber || "+8801349529274");
      setRocketNumber(settings.data.rocketNumber || "+8801349529274");
      setDeliveryChargeDhaka(String(settings.data.deliveryChargeDhaka ?? 0));
      setDeliveryChargeOutsideDhaka(String(settings.data.deliveryChargeOutsideDhaka ?? 120));
      setFeaturedPictureUrl(settings.data.featuredPictureUrl || "");
      setFeaturedTitle(settings.data.featuredTitle || "");
      setFeaturedPictureLink(settings.data.featuredPictureLink || "");
      setFeaturedProductId(settings.data.featuredProductId || "");
      setHeroBadge(settings.data.heroBadge || "Premium Collection");
      setHeroHeading(settings.data.heroHeading || "RABIORA");
      setHeroTagline(settings.data.heroTagline || "Elegance • Comfort • Confidence");
      setPromoActive(settings.data.promoActive ?? false);
      setPromoText(settings.data.promoText || "Flash Sale — Special Discount on Authentic Pakistani Lawn & Silk!");
      setPromoDiscountText(settings.data.promoDiscountText || "10% OFF");
      setPromoCountdownEnd(settings.data.promoCountdownEnd || "");
      setPromoCountdownActive(settings.data.promoCountdownActive ?? true);
      setPromoButtonText(settings.data.promoButtonText || "Shop Sale");
      setPromoLink(settings.data.promoLink || "/#products");
    }
  }, [settings.data]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      bkashNumber,
      nagadNumber,
      rocketNumber,
      deliveryChargeDhaka: Number(deliveryChargeDhaka) || 0,
      deliveryChargeOutsideDhaka: Number(deliveryChargeOutsideDhaka) || 120,
      featuredPictureUrl: featuredPictureUrl.trim() || undefined,
      featuredTitle: featuredTitle.trim() || undefined,
      featuredPictureLink: featuredPictureLink.trim() || undefined,
      featuredProductId: featuredProductId.trim() || undefined,
      heroBadge,
      heroHeading,
      heroTagline,
      promoActive,
      promoText,
      promoDiscountText,
      promoCountdownEnd,
      promoCountdownActive,
      promoButtonText,
      promoLink,
    });
  };

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>System Configuration</p>
          <h1>Payment, Delivery & Site Settings</h1>
        </div>
      </section>

      <form className="admin-form" onSubmit={handleSubmit}>
        {/* Promotional Discount & Countdown Bar Section */}
        <h2>Promotional Discount + Countdown Bar</h2>
        <p className="muted">Configure the top promotional banner with live countdown timer and discount highlights.</p>

        <div className="admin-field-pair">
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={promoActive}
              onChange={(e) => setPromoActive(e.target.checked)}
              style={{ width: "20px", height: "20px" }}
            />
            <strong>Enable Promotional Bar on Storefront</strong>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={promoCountdownActive}
              onChange={(e) => setPromoCountdownActive(e.target.checked)}
              style={{ width: "20px", height: "20px" }}
            />
            <strong>Enable Live Countdown Timer</strong>
          </label>
        </div>

        <div className="admin-field-pair">
          <label>
            Promo Headline / Message
            <input
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              placeholder="e.g. Flash Sale — Special Discount on Pakistani Lawn & Silk!"
            />
          </label>

          <label>
            Discount Badge Text
            <input
              value={promoDiscountText}
              onChange={(e) => setPromoDiscountText(e.target.value)}
              placeholder="e.g. 10% OFF or Limited Deal"
            />
          </label>
        </div>

        <div className="admin-field-pair">
          <label>
            Countdown End Time (ISO / Date & Time)
            <input
              type="datetime-local"
              value={promoCountdownEnd ? new Date(promoCountdownEnd).toISOString().slice(0, 16) : ""}
              onChange={(e) => setPromoCountdownEnd(e.target.value ? new Date(e.target.value).toISOString() : "")}
            />
          </label>

          <label>
            Button Text & Link Destination
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <input
                value={promoButtonText}
                onChange={(e) => setPromoButtonText(e.target.value)}
                placeholder="Shop Sale"
              />
              <input
                value={promoLink}
                onChange={(e) => setPromoLink(e.target.value)}
                placeholder="/#products"
              />
            </div>
          </label>
        </div>

        <h2 style={{ marginTop: "1.5rem" }}>Delivery Charges (৳ BDT)</h2>
        <p className="muted">These fees will automatically apply at checkout based on the customer's selected district.</p>

        <div className="admin-field-pair">
          <label>
            Inside Dhaka Delivery Charge (৳)
            <input
              required
              type="number"
              min="0"
              value={deliveryChargeDhaka}
              onChange={(e) => setDeliveryChargeDhaka(e.target.value)}
              placeholder="0 (Free)"
            />
          </label>

          <label>
            Outside Dhaka Delivery Charge (৳)
            <input
              required
              type="number"
              min="0"
              value={deliveryChargeOutsideDhaka}
              onChange={(e) => setDeliveryChargeOutsideDhaka(e.target.value)}
              placeholder="120"
            />
          </label>
        </div>

        <h2 style={{ marginTop: "1.5rem" }}>Payment Wallet Numbers</h2>
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

        <h2 style={{ marginTop: "1.5rem" }}>Hero Brand Messaging</h2>

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
            <p className="admin-empty-text">No offer banners created yet.</p>
          ) : (
            <div className="admin-offer-list">
              {offers.data?.map((banner) => (
                <article key={banner.id} className="admin-offer-card">
                  <div className="admin-offer-card-top">
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="admin-offer-img"
                      />
                    ) : (
                      <div className="admin-offer-placeholder">
                        📝
                      </div>
                    )}
                    <div className="admin-offer-details">
                      <h4 className="admin-offer-title">{banner.title}</h4>
                      <div className="admin-offer-pills">
                        <span className="status-pill status-confirmed">
                          {banner.offerType === "image_banner" ? "🖼️ Image Banner" : "📝 Text Offer"}
                        </span>
                        <span className={`status-pill ${banner.isActive ? "status-confirmed" : "status-pending"}`}>
                          {banner.isActive ? "Active" : "Hidden"}
                        </span>
                      </div>
                      {banner.subtitle && <p className="admin-offer-subtitle">{banner.subtitle}</p>}
                      <p className="admin-offer-meta">
                        {banner.badge ? `Badge: ${banner.badge} • ` : ""}{banner.discountCode ? `Code: ${banner.discountCode} • ` : ""}Order: {banner.displayOrder}
                      </p>
                    </div>
                  </div>
                  <div className="admin-offer-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
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
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleEdit(banner)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-action btn-sm"
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

function CouponManager() {
  const utils = trpc.useUtils();
  const coupons = trpc.admin.coupons.list.useQuery();

  const create = trpc.admin.coupons.create.useMutation({
    onSuccess: () => {
      utils.admin.coupons.list.invalidate();
      resetForm();
    },
  });

  const update = trpc.admin.coupons.update.useMutation({
    onSuccess: () => {
      utils.admin.coupons.list.invalidate();
      resetForm();
    },
  });

  const remove = trpc.admin.coupons.delete.useMutation({
    onSuccess: () => utils.admin.coupons.list.invalidate(),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [allowedPaymentMethods, setAllowedPaymentMethods] = useState<string[]>([
    "bKash",
    "Nagad",
    "Rocket",
  ]);
  const [error, setError] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setDiscountValue(10);
    setMinOrderAmount(0);
    setUsageLimit("");
    setExpiryDate("");
    setIsActive(true);
    setAllowedPaymentMethods(["bKash", "Nagad", "Rocket"]);
    setError("");
  };

  const handleEdit = (coupon: any) => {
    setEditingId(coupon.id);
    setCode(coupon.code);
    setDiscountValue(coupon.discountValue);
    setMinOrderAmount(coupon.minOrderAmount || 0);
    setUsageLimit(coupon.usageLimit ?? "");
    setExpiryDate(
      coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split("T")[0] : ""
    );
    setIsActive(coupon.isActive);
    setAllowedPaymentMethods(coupon.allowedPaymentMethods || ["bKash", "Nagad", "Rocket"]);
    setError("");
  };

  const handleTogglePaymentMethod = (method: string) => {
    setAllowedPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Coupon code is required.");
      return;
    }

    if (discountValue < 1 || discountValue > 100) {
      setError("Discount percentage must be between 1 and 100.");
      return;
    }

    if (allowedPaymentMethods.length === 0) {
      setError("Please select at least one eligible payment method.");
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      usageLimit: usageLimit === "" ? null : Number(usageLimit),
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      isActive,
      allowedPaymentMethods,
    };

    if (editingId) {
      update.mutate(
        { id: editingId, ...payload },
        { onError: (err) => setError(err.message) }
      );
    } else {
      create.mutate(payload, {
        onError: (err) => setError(err.message),
      });
    }
  };

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Discounts & Promotions</p>
          <h1>Coupon Codes</h1>
        </div>
        <span className="status-pill status-confirmed">
          {coupons.data?.length ?? 0} Coupons Configured
        </span>
      </section>

      <div className="admin-grid">
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit Coupon" : "New Coupon Code"}</h2>

          {error && <p className="form-error" role="alert">{error}</p>}

          <label>
            Coupon Code
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., RABIORA10"
              style={{ textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}
            />
          </label>

          <div className="admin-field-pair">
            <label>
              Discount Percentage (%)
              <input
                required
                type="number"
                min="1"
                max="100"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
              />
            </label>

            <label>
              Min. Order Amount (৳ BDT)
              <input
                type="number"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                placeholder="0 for no minimum"
              />
            </label>
          </div>

          <div className="admin-field-pair">
            <label>
              Usage Limit (Max Redemptions)
              <input
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Leave blank for unlimited"
              />
            </label>

            <label>
              Expiry Date
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </label>
          </div>

          <label>
            Allowed Online Payment Methods
            <div style={{ display: "flex", gap: "14px", marginTop: "6px" }}>
              {["bKash", "Nagad", "Rocket"].map((method) => (
                <label key={method} className="admin-checkbox" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={allowedPaymentMethods.includes(method)}
                    onChange={() => handleTogglePaymentMethod(method)}
                  />
                  <span>{method}</span>
                </label>
              ))}
            </div>
            <small style={{ color: "var(--gray)", display: "block", marginTop: "4px" }}>
              Note: Coupons are strictly disallowed on Cash on Delivery by system policy.
            </small>
          </label>

          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Active & Redeemable on Checkout</span>
          </label>

          <div className="admin-actions">
            <button className="btn" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
            </button>
            {editingId && (
              <button type="button" className="btn-outline" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="admin-list-card">
          <h2>Configured Coupons ({coupons.data?.length ?? 0})</h2>
          {coupons.isLoading ? (
            <p>Loading coupons...</p>
          ) : coupons.data?.length === 0 ? (
            <p>No coupons found.</p>
          ) : (
            <div className="admin-product-list">
              {coupons.data?.map((c) => (
                <article key={c.id} className="admin-product-row">
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "10px",
                      background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                      color: "var(--primary)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "22px",
                    }}
                  >
                    🏷️
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "16px", letterSpacing: "0.5px" }}>{c.code}</strong>
                      <span className={`status-pill ${c.isActive ? "status-confirmed" : "status-pending"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p style={{ margin: "3px 0", fontSize: "13px" }}>
                      Discount: <strong style={{ color: "#16a34a" }}>{c.discountValue}% OFF</strong>
                      {c.minOrderAmount > 0 && ` • Min Order: ৳${c.minOrderAmount.toLocaleString("en-BD")}`}
                    </p>
                    <small>
                      Usage: <strong>{c.usedCount}</strong> / {c.usageLimit ? `${c.usageLimit} max` : "Unlimited"} • Expiry:{" "}
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-BD") : "Never"}
                    </small>
                    <small style={{ display: "block" }}>
                      Valid on: {c.allowedPaymentMethods?.join(", ") || "bKash, Nagad, Rocket"}
                    </small>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      onClick={() => {
                        update.mutate({
                          id: c.id,
                          isActive: !c.isActive,
                        });
                      }}
                      title={c.isActive ? "Deactivate coupon" : "Activate coupon"}
                    >
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button type="button" onClick={() => handleEdit(c)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        if (window.confirm(`Delete coupon "${c.code}"?`)) {
                          remove.mutate({ id: c.id });
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
          <p className="admin-loading-text">Loading subscribers...</p>
        ) : subscribers.data?.length === 0 ? (
          <p className="admin-empty-text">No subscribers have signed up yet.</p>
        ) : (
          <div className="admin-subscriber-list">
            {subscribers.data?.map((sub) => (
              <article key={sub.id} className="admin-subscriber-card">
                <div className="admin-subscriber-header">
                  <div className="admin-subscriber-email-wrap">
                    <strong className="admin-subscriber-email admin-break-all">{sub.email}</strong>
                    <small className="admin-subscriber-date">Subscribed: {new Date(sub.createdAt).toLocaleDateString("en-BD")}</small>
                  </div>
                  <span className="status-pill status-confirmed">
                    {sub.residency === "inside_bangladesh" ? "🇧🇩 Bangladesh" : "🌍 International"}
                  </span>
                </div>
                <p className="admin-subscriber-phone">
                  <span className="admin-detail-label">Mobile:</span> {sub.phone || "—"}
                </p>
                <div className="admin-subscriber-actions">
                  <button
                    type="button"
                    className="btn btn-danger-action btn-sm"
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

function FeaturedCollectionManager() {
  const utils = trpc.useUtils();
  const settings = trpc.settings.get.useQuery();
  const products = trpc.admin.products.list.useQuery();

  const updateSettings = trpc.admin.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      setSpotlightSaved("Featured spotlight banner updated successfully!");
      setTimeout(() => setSpotlightSaved(""), 4000);
    },
  });

  const updateProduct = trpc.admin.products.update.useMutation({
    onSuccess: () => {
      utils.admin.products.list.invalidate();
      utils.catalogue.list.invalidate();
    },
  });

  // Spotlight State
  const [featuredPictureUrl, setFeaturedPictureUrl] = useState("");
  const [featuredTitle, setFeaturedTitle] = useState("");
  const [featuredPictureLink, setFeaturedPictureLink] = useState("");
  const [featuredProductId, setFeaturedProductId] = useState("");
  const [spotlightSaved, setSpotlightSaved] = useState("");

  // Product Catalogue Filter State
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "featured_only">("all");

  useEffect(() => {
    if (settings.data) {
      setFeaturedPictureUrl(settings.data.featuredPictureUrl || "");
      setFeaturedTitle(settings.data.featuredTitle || "");
      setFeaturedPictureLink(settings.data.featuredPictureLink || "");
      setFeaturedProductId(settings.data.featuredProductId || "");
    }
  }, [settings.data]);

  const handleSpotlightSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      featuredPictureUrl: featuredPictureUrl.trim() || undefined,
      featuredTitle: featuredTitle.trim() || undefined,
      featuredPictureLink: featuredPictureLink.trim() || undefined,
      featuredProductId: featuredProductId.trim() || undefined,
    });
  };

  const filteredProducts = useMemo(() => {
    let list = products.data ?? [];
    if (filterMode === "featured_only") {
      list = list.filter((p) => p.featured);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q) || p.fabric.toLowerCase().includes(q));
    }
    return list;
  }, [products.data, filterMode, search]);

  const featuredCount = useMemo(() => (products.data ?? []).filter((p) => p.featured).length, [products.data]);

  const toggleFeatured = async (product: any) => {
    const isCurrentlyFeatured = product.featured;
    await updateProduct.mutateAsync({
      id: product.id,
      product: {
        categoryId: product.categoryId,
        name: product.name,
        slug: product.slug,
        sku: product.sku || undefined,
        details: product.details,
        fabric: product.fabric,
        color: product.color,
        priceTaka: product.priceTaka,
        oldPriceTaka: product.oldPriceTaka || undefined,
        stockQuantity: product.stockQuantity,
        featured: !isCurrentlyFeatured,
      },
    });
  };

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Storefront Merchandising</p>
          <h1>Featured Showcase Collection</h1>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className="status-pill status-confirmed">
            ★ {featuredCount} Featured on Storefront
          </span>
          <a href="/#products" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ fontSize: "12px", padding: "6px 12px" }}>
            Preview Storefront ↗
          </a>
        </div>
      </section>

      {/* Featured Spotlight Banner Section */}
      <form className="admin-form" onSubmit={handleSpotlightSubmit}>
        <h2>✨ Featured Spotlight Hero Banner</h2>
        <p className="muted">Set a high-visibility spotlight image banner and product destination link on the homepage.</p>

        <label>
          Spotlight Banner / Picture URL
          <input
            value={featuredPictureUrl}
            onChange={(e) => setFeaturedPictureUrl(e.target.value)}
            placeholder="https://... or /uploads/images/..."
          />
        </label>

        <div className="admin-field-pair">
          <label>
            Spotlight Title / Headline
            <input
              value={featuredTitle}
              onChange={(e) => setFeaturedTitle(e.target.value)}
              placeholder="e.g. Royal Embroidered Velvet Collection"
            />
          </label>

          <label>
            Destination Product (Dropdown Selector)
            <select
              value={featuredProductId}
              onChange={(e) => {
                setFeaturedProductId(e.target.value);
                if (e.target.value) {
                  setFeaturedPictureLink(`/products/${e.target.value}`);
                }
              }}
            >
              <option value="">-- Custom Link or None --</option>
              {products.data?.map((p) => (
                <option key={p.id} value={p.slug || String(p.id)}>
                  {p.name} ({p.sku || p.slug})
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Destination Link URL (Storefront path or custom route)
          <input
            value={featuredPictureLink}
            onChange={(e) => setFeaturedPictureLink(e.target.value)}
            placeholder="/#products or /products/your-slug"
          />
        </label>

        {spotlightSaved && <p className="form-success" role="status">{spotlightSaved}</p>}

        <button className="btn" disabled={updateSettings.isPending} style={{ width: "fit-content" }}>
          {updateSettings.isPending ? "Saving Spotlight..." : "Save Spotlight Banner"}
        </button>
      </form>

      {/* Product Featured Catalogue Toggles */}
      <section className="admin-list-card">
        <h2 style={{ marginBottom: "12px" }}>Featured Products Grid</h2>
        <p className="muted" style={{ marginBottom: "16px" }}>
          Toggle products to feature them on the storefront homepage Featured Showcase section.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className={`btn-filter ${filterMode === "all" ? "active" : ""}`}
              onClick={() => setFilterMode("all")}
            >
              All Products ({products.data?.length ?? 0})
            </button>
            <button
              type="button"
              className={`btn-filter ${filterMode === "featured_only" ? "active" : ""}`}
              onClick={() => setFilterMode("featured_only")}
            >
              Featured Only ({featuredCount})
            </button>
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "260px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
          />
        </div>

        {products.isLoading ? (
          <p>Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p>No matching products found.</p>
        ) : (
          <div className="admin-featured-list">
            {filteredProducts.map((p) => {
              const coverImg = p.images.find((img: any) => img.isCover) || p.images[0];
              return (
                <article key={p.id} className={`admin-featured-card ${p.featured ? "is-featured" : ""}`}>
                  <div className="admin-featured-card-body">
                    {coverImg ? (
                      <img src={coverImg.storageUrl} alt={p.name} className="admin-featured-thumb" />
                    ) : (
                      <div className="admin-featured-thumb admin-featured-thumb-fallback">No Img</div>
                    )}
                    <div className="admin-featured-info">
                      <div className="admin-featured-header-line">
                        <h4 className="admin-featured-product-name">{p.name}</h4>
                        {p.featured ? (
                          <span className="badge badge-featured">
                            ★ Featured
                          </span>
                        ) : (
                          <span className="badge badge-standard">Standard</span>
                        )}
                      </div>
                      <p className="admin-featured-details-line">
                        <span className="admin-featured-cat">{p.categoryName}</span> • <span className="admin-featured-price">৳{p.priceTaka.toLocaleString("en-BD")}</span> • Fabric: {p.fabric} • Stock: {p.stockQuantity}
                      </p>
                    </div>
                  </div>
                  <div className="admin-featured-actions">
                    <button
                      type="button"
                      disabled={updateProduct.isPending}
                      className={`btn btn-sm ${p.featured ? "btn-danger-action" : "btn-gold-action"}`}
                      onClick={() => toggleFeatured(p)}
                    >
                      {p.featured ? "Remove from Featured" : "★ Mark as Featured"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function AnnouncementsManager() {
  const utils = trpc.useUtils();
  const announcements = trpc.admin.announcements.list.useQuery();

  const createMutation = trpc.admin.announcements.create.useMutation({
    onSuccess: () => {
      utils.admin.announcements.list.invalidate();
      utils.announcements.list.invalidate();
      resetForm();
    },
  });

  const updateMutation = trpc.admin.announcements.update.useMutation({
    onSuccess: () => {
      utils.admin.announcements.list.invalidate();
      utils.announcements.list.invalidate();
      resetForm();
    },
  });

  const deleteMutation = trpc.admin.announcements.delete.useMutation({
    onSuccess: () => {
      utils.admin.announcements.list.invalidate();
      utils.announcements.list.invalidate();
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState("1");
  const [error, setError] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setText("");
    setLink("");
    setIsActive(true);
    setDisplayOrder("1");
    setError("");
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setText(item.text);
    setLink(item.link || "");
    setIsActive(item.isActive);
    setDisplayOrder(String(item.displayOrder ?? 1));
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!text.trim()) {
      setError("Announcement text is required.");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          text: text.trim(),
          link: link.trim() || undefined,
          isActive,
          displayOrder: Number(displayOrder) || 0,
        });
      } else {
        await createMutation.mutateAsync({
          text: text.trim(),
          link: link.trim() || undefined,
          isActive,
          displayOrder: Number(displayOrder) || 0,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save announcement.");
    }
  };

  const handleToggle = async (item: any) => {
    await updateMutation.mutateAsync({
      id: item.id,
      isActive: !item.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Storefront Communication</p>
          <h1>Top Announcement Bar Manager</h1>
        </div>
      </section>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Announcement" : "Create New Announcement"}</h2>
        <p className="muted">
          Active announcements appear in the rotating/scrolling top bar across the storefront.
        </p>

        {error && <p className="form-error" role="alert">{error}</p>}

        <label>
          Announcement Text (Required)
          <input
            required
            type="text"
            placeholder="e.g. Free Delivery Inside Dhaka on all orders over ৳2,000"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <div className="admin-field-pair">
          <label>
            Destination Link (Optional)
            <input
              type="text"
              placeholder="/#products or /customer-service/shipping"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </label>

          <label>
            Sort Order (Lower appears first)
            <input
              type="number"
              min="0"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </label>
        </div>

        <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>Active (Visible on Storefront)</span>
        </label>

        <div className="admin-actions" style={{ display: "flex", gap: "10px" }}>
          <button className="btn" disabled={createMutation.isPending || updateMutation.isPending}>
            {editingId ? "Update Announcement" : "Create Announcement"}
          </button>
          {editingId && (
            <button type="button" className="btn-outline" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <section className="admin-list-card">
        <h2>Active Announcements ({announcements.data?.length ?? 0})</h2>

        {announcements.isLoading ? (
          <p>Loading announcements...</p>
        ) : !announcements.data || announcements.data.length === 0 ? (
          <p>No announcements configured yet.</p>
        ) : (
          <div className="admin-product-list">
            {announcements.data.map((item) => (
              <article key={item.id} className="admin-product-row" style={{ borderLeft: item.isActive ? "4px solid #18A89E" : "4px solid #91A5A4" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <strong>{item.text}</strong>
                    <span className={`status-pill ${item.isActive ? "status-confirmed" : "status-pending"}`}>
                      {item.isActive ? "✓ Live" : "Hidden"}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--gray)" }}>Order: {item.displayOrder}</span>
                  </div>
                  {item.link && (
                    <p style={{ margin: "4px 0", fontSize: "12px", color: "var(--gray)" }}>
                      Link: <code>{item.link}</code>
                    </p>
                  )}
                </div>
                <div className="row-actions">
                  <button type="button" className="btn" onClick={() => handleToggle(item)}>
                    {item.isActive ? "Disable" : "Enable"}
                  </button>
                  <button type="button" className="btn" onClick={() => handleEdit(item)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(item.id)}>
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

function FlashSaleManager() {
  const utils = trpc.useUtils();
  const flashSaleQuery = trpc.admin.flashSale.get.useQuery();
  const allProductsQuery = trpc.admin.products.list.useQuery();

  const updateMutation = trpc.admin.flashSale.update.useMutation({
    onSuccess: () => {
      utils.admin.flashSale.get.invalidate();
      utils.flashSale.get.invalidate();
      setSavedStatus("Flash Sale campaign settings updated successfully!");
      setTimeout(() => setSavedStatus(""), 4000);
    },
  });

  const addProductMutation = trpc.admin.flashSale.addProduct.useMutation({
    onSuccess: () => {
      utils.admin.flashSale.get.invalidate();
      utils.flashSale.get.invalidate();
    },
  });

  const removeProductMutation = trpc.admin.flashSale.removeProduct.useMutation({
    onSuccess: () => {
      utils.admin.flashSale.get.invalidate();
      utils.flashSale.get.invalidate();
    },
  });

  const [campaignName, setCampaignName] = useState("Rabiora Flash Sale");
  const [title, setTitle] = useState("⚡ Exclusive Flash Sale — Up to 20% OFF on Selected Luxury Pieces");
  const [subtitle, setSubtitle] = useState("Limited time offer on handcrafted Pakistani Lawn & Silk Three-Piece sets");
  const [badgeText, setBadgeText] = useState("⚡ FLASH SALE DEAL");
  const [isActive, setIsActive] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [ctaText, setCtaText] = useState("Shop Flash Sale");
  const [ctaLink, setCtaLink] = useState("/#products");
  const [savedStatus, setSavedStatus] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [isAddingBulk, setIsAddingBulk] = useState(false);

  useEffect(() => {
    if (flashSaleQuery.data) {
      const data = flashSaleQuery.data;
      setCampaignName(data.campaignName || "Rabiora Flash Sale");
      setTitle(data.title || "⚡ Exclusive Flash Sale — Up to 20% OFF on Selected Luxury Pieces");
      setSubtitle(data.subtitle || "");
      setBadgeText(data.badgeText || "⚡ FLASH SALE DEAL");
      setIsActive(data.isActive ?? true);
      setStartTime(data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : "");
      setEndTime(data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : "");
      setCtaText(data.ctaText || "Shop Flash Sale");
      setCtaLink(data.ctaLink || "/#products");
    }
  }, [flashSaleQuery.data]);

  const handleSubmitSettings = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      campaignName,
      title,
      subtitle,
      badgeText,
      isActive,
      startTime: startTime ? new Date(startTime).toISOString() : null,
      endTime: endTime ? new Date(endTime).toISOString() : null,
      ctaText,
      ctaLink,
    });
  };

  const handleAddProduct = async (productId: string) => {
    await addProductMutation.mutateAsync({ productId });
  };

  const handleRemoveProduct = async (productId: string) => {
    await removeProductMutation.mutateAsync({ productId });
  };

  const handleBulkAdd = async () => {
    if (selectedToAdd.length === 0) return;
    setIsAddingBulk(true);
    try {
      const currentIds = flashSaleQuery.data?.productIds || [];
      const mergedIds = Array.from(new Set([...currentIds, ...selectedToAdd]));
      await updateMutation.mutateAsync({ productIds: mergedIds });
      setSelectedToAdd([]);
    } finally {
      setIsAddingBulk(false);
    }
  };

  const attachedProducts = flashSaleQuery.data?.products || [];
  const attachedIdSet = new Set((flashSaleQuery.data?.productIds || []).map(String));

  const availableProducts = (allProductsQuery.data || []).filter((p: any) => {
    const matchesSearch =
      !productSearch.trim() ||
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(productSearch.toLowerCase()));
    return matchesSearch && !attachedIdSet.has(String(p.id)) && !attachedIdSet.has(String(p._id));
  });

  return (
    <div className="admin-stack">
      <section className="admin-heading">
        <div>
          <p>Promotions & Campaigns</p>
          <h1>⚡ Flash Sale Manager</h1>
        </div>
      </section>

      {/* 1. Campaign Settings Form */}
      <form className="admin-form" onSubmit={handleSubmitSettings}>
        <h2>Flash Sale Configuration</h2>
        <p className="muted">
          Controls the dedicated Promotional / Flash Sale bar placed between Featured Collection and the Main Products section on the homepage.
        </p>

        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", margin: "10px 0" }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            style={{ width: "20px", height: "20px" }}
          />
          <strong>Enable Flash Sale on Storefront (Live)</strong>
        </label>

        <div className="admin-field-pair">
          <label>
            Campaign Name (Admin Internal)
            <input
              required
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Summer Luxury Drop Flash Sale"
            />
          </label>

          <label>
            Badge Text
            <input
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="e.g. ⚡ FLASH SALE DEAL"
            />
          </label>
        </div>

        <label>
          Storefront Headline / Title
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. ⚡ Exclusive Flash Sale — Up to 20% OFF on Selected Luxury Pieces"
          />
        </label>

        <label>
          Subtitle / Promotional Details
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Limited time offer on handcrafted Pakistani Lawn & Silk Three-Piece sets"
            rows={2}
          />
        </label>

        <div className="admin-field-pair">
          <label>
            Start Time (Optional)
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>

          <label>
            Countdown End Time (Required for live timer)
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
        </div>

        <div className="admin-field-pair">
          <label>
            CTA Button Text
            <input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Shop Flash Sale"
            />
          </label>

          <label>
            CTA Button Destination Link
            <input
              value={ctaLink}
              onChange={(e) => setCtaLink(e.target.value)}
              placeholder="/#products"
            />
          </label>
        </div>

        {savedStatus && <p className="form-success" role="status">{savedStatus}</p>}

        <button className="btn" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving Settings..." : "Save Flash Sale Settings"}
        </button>
      </form>

      {/* 2. Attached Flash Sale Products Management */}
      <section className="admin-list-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <div>
            <h2>Selected Flash Sale Products ({attachedProducts.length})</h2>
            <p className="muted" style={{ margin: 0 }}>
              These existing products are featured as part of the active Flash Sale. Zero duplicate products are created.
            </p>
          </div>

          {attachedProducts.length > 0 && (
            <button
              type="button"
              className="danger"
              onClick={() => {
                if (confirm("Remove all products from this Flash Sale?")) {
                  updateMutation.mutate({ productIds: [] });
                }
              }}
            >
              Clear All Flash Sale Products
            </button>
          )}
        </div>

        {flashSaleQuery.isLoading ? (
          <p>Loading Flash Sale products...</p>
        ) : attachedProducts.length === 0 ? (
          <div className="empty-state-box" style={{ padding: "30px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "12px" }}>
            <p style={{ margin: "0 0 10px", color: "var(--muted-foreground)" }}>No products added to this Flash Sale yet.</p>
            <p style={{ fontSize: "13px", margin: 0 }}>Select products below to include them in the Flash Sale.</p>
          </div>
        ) : (
          <div className="admin-product-list">
            {attachedProducts.map((p: any) => (
              <article key={p.id} className="admin-product-row">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{ width: "48px", height: "58px", objectFit: "cover", borderRadius: "6px" }}
                    />
                  ) : (
                    <div style={{ width: "48px", height: "58px", background: "var(--muted)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                      No img
                    </div>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {p.name}
                    </strong>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", fontSize: "12px", marginTop: "4px" }}>
                      <span style={{ color: "var(--primary)", fontWeight: 700 }}>৳{p.priceTaka?.toLocaleString("en-BD")}</span>
                      {p.oldPriceTaka ? (
                        <span style={{ color: "var(--muted-foreground)", textDecoration: "line-through" }}>
                          ৳{p.oldPriceTaka.toLocaleString("en-BD")}
                        </span>
                      ) : null}
                      <span className={`status-pill ${p.isInStock ? "status-confirmed" : "status-pending"}`}>
                        {p.isInStock ? `In Stock (${p.stockQuantity})` : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="row-actions">
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleRemoveProduct(p.id)}
                    disabled={removeProductMutation.isPending}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 3. Add Existing Products to Flash Sale */}
      <section className="admin-list-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h2>Add Products to Flash Sale</h2>
            <p className="muted" style={{ margin: 0 }}>
              Search and select existing products from your store catalog to include in this Flash Sale.
            </p>
          </div>

          {selectedToAdd.length > 0 && (
            <button
              type="button"
              className="btn btn-luxury-primary"
              onClick={handleBulkAdd}
              disabled={isAddingBulk}
            >
              Add Selected ({selectedToAdd.length}) to Flash Sale
            </button>
          )}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search products by name, SKU or category..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px" }}
          />
        </div>

        {allProductsQuery.isLoading ? (
          <p>Loading catalogue products...</p>
        ) : availableProducts.length === 0 ? (
          <p style={{ color: "var(--muted-foreground)" }}>
            {productSearch ? "No matching available products found." : "All catalog products are already in this Flash Sale."}
          </p>
        ) : (
          <div className="admin-product-list" style={{ maxHeight: "450px", overflowY: "auto" }}>
            {availableProducts.map((p: any) => {
              const coverImg = p.images?.find((img: any) => img.isCover) ?? p.images?.[0];
              const isChecked = selectedToAdd.includes(String(p.id));

              return (
                <article key={p.id} className="admin-product-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedToAdd((prev) => [...prev, String(p.id)]);
                        } else {
                          setSelectedToAdd((prev) => prev.filter((id) => id !== String(p.id)));
                        }
                      }}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />

                    {coverImg ? (
                      <img
                        src={coverImg.storageUrl}
                        alt={p.name}
                        style={{ width: "42px", height: "52px", objectFit: "cover", borderRadius: "6px" }}
                      />
                    ) : (
                      <div style={{ width: "42px", height: "52px", background: "var(--muted)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                        No img
                      </div>
                    )}

                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {p.name}
                      </strong>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", marginTop: "2px" }}>
                        <span style={{ color: "var(--primary)", fontWeight: 700 }}>৳{p.priceTaka?.toLocaleString("en-BD")}</span>
                        <span style={{ color: "var(--muted-foreground)" }}>{p.categoryName || "Pakistani Lawn"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleAddProduct(p.id)}
                      disabled={addProductMutation.isPending}
                    >
                      + Add to Flash Sale
                    </button>
                  </div>
                </article>
              );
            })}
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
  ) : location === "/admin/flash-sale" ? (
    <FlashSaleManager />
  ) : location === "/admin/featured" ? (
    <FeaturedCollectionManager />
  ) : location === "/admin/announcements" ? (
    <AnnouncementsManager />
  ) : location === "/admin/categories" ? (
    <CategoryManager />
  ) : location === "/admin/orders" ? (
    <OrderManager />
  ) : location === "/admin/coupons" ? (
    <CouponManager />
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
