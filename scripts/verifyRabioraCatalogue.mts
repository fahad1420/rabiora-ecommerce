import { listCatalogue } from "../server/catalogue";

async function verify() {
  const products = await listCatalogue();
  const featuredProducts = await listCatalogue({ featured: true });
  const matchedProducts = await listCatalogue({ query: "Pakistani" });

  if (products.length !== 24) throw new Error(`Expected 24 imported products, received ${products.length}.`);
  if (featuredProducts.length !== 9) throw new Error(`Expected 9 featured products, received ${featuredProducts.length}.`);
  if (matchedProducts.length === 0) throw new Error("Search verification returned no expected Pakistani catalogue products.");
  if (products.some((product) => !product.images.some((image) => image.isCover))) {
    throw new Error("At least one imported product has no cover image record.");
  }

  console.log(JSON.stringify({
    products: products.length,
    featuredProducts: featuredProducts.length,
    searchableProducts: matchedProducts.length,
    imageRecords: products.reduce((total, product) => total + product.images.length, 0),
  }, null, 2));
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
