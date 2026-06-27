const splitImages = (images) => {
  if (Array.isArray(images)) {
    return images.map((url) => String(url || '').trim()).filter(Boolean);
  }

  if (typeof images === 'string') {
    return images
      .split(/[\n,;]+/)
      .map((url) => url.trim())
      .filter(Boolean);
  }

  return [];
};

const toVariantId = (variant, index) => {
  if (variant.id) return String(variant.id);
  const source = variant.name || variant.name_zh || `variant-${index + 1}`;
  const slug = String(source)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `variant-${index + 1}`;
};

export const normalizeVariants = (product) => {
  if (!product?.variants) return [];

  const rawVariants = Array.isArray(product.variants)
    ? product.variants
    : Object.values(product.variants);

  return rawVariants
    .map((variant, index) => {
      const images = splitImages(variant.images);
      const image = String(variant.image || images[0] || '').trim();

      return {
        id: toVariantId(variant, index),
        name: String(variant.name || '').trim(),
        name_zh: String(variant.name_zh || '').trim(),
        price: variant.price === '' || variant.price == null || Number.isNaN(Number(variant.price))
          ? null
          : Math.max(0, Number(variant.price)),
        image,
        images: images.length ? images : image ? [image] : [],
        stock: variant.stock === '' || variant.stock == null || Number.isNaN(Number(variant.stock))
          ? 0
          : Math.max(0, parseInt(variant.stock) || 0),
      };
    })
    .filter((variant) => variant.name || variant.name_zh || variant.image || variant.images.length);
};

export const getProductImages = (product, variant = null) => {
  const variantImages = variant ? splitImages(variant.images) : [];
  const variantMainImage = variant?.image ? [variant.image] : [];

  const mainImages = [];
  if (product?.image) {
    mainImages.push(product.image);
  }
  const additionalImages = splitImages(product?.images);
  mainImages.push(...additionalImages);

  const preferredImages = variant
    ? [...variantMainImage, ...variantImages, ...mainImages]
    : mainImages;

  const images = preferredImages
    .map((url) => String(url || '').trim())
    .filter(Boolean);

  return [...new Set(images)];
};

export const getVariantLabel = (variant, language = 'en') => {
  if (!variant) return '';
  return language === 'zh' && variant.name_zh ? variant.name_zh : variant.name || variant.name_zh;
};

export const usesIndividualVariantPrices = (product) => product?.variantPricing === 'individual';

export const getProductPrice = (product, variant = null) => {
  const basePrice = Math.max(0, Number(product?.price) || 0);
  if (usesIndividualVariantPrices(product) && variant?.price != null) {
    return Math.max(0, Number(variant.price) || 0);
  }
  return basePrice;
};

export const getProductPriceRange = (product) => {
  const variants = normalizeVariants(product);
  const prices = usesIndividualVariantPrices(product) && variants.length > 0
    ? variants.map((variant) => getProductPrice(product, variant))
    : [getProductPrice(product)];

  return { min: Math.min(...prices), max: Math.max(...prices) };
};

export const getDiscountInfo = (product, price = getProductPrice(product)) => {
  const discountType = product?.discountType;
  const discountValue = Number(product?.discountValue) || 0;

  if (!discountType || discountType === 'none' || discountValue <= 0) {
    return { hasDiscount: false, originalPrice: price, finalPrice: price, badge: null, savings: 0 };
  }

  if (discountType === 'percentage') {
    const percentage = Math.min(Math.max(discountValue, 0), 100);
    const finalPrice = Math.max(0, price - (price * percentage / 100));
    return {
      hasDiscount: percentage > 0,
      originalPrice: price,
      finalPrice,
      badge: `${percentage}% OFF`,
      savings: price - finalPrice,
    };
  }

  if (discountType === 'amount') {
    const finalPrice = Math.max(0, price - discountValue);
    const percentage = price > 0 ? Math.round(((price - finalPrice) / price) * 100) : 0;
    return {
      hasDiscount: discountValue > 0,
      originalPrice: price,
      finalPrice,
      badge: `${percentage}% OFF`,
      savings: price - finalPrice,
    };
  }

  return { hasDiscount: false, originalPrice: price, finalPrice: price, badge: null, savings: 0 };
};

export const getCartItemKey = (item) => item.cartKey || `${item.id}::${item.variantId || 'base'}`;

export const buildCartProduct = (product, variant, finalPrice = product.price) => {
  const variantImages = getProductImages(product, variant);
  const variantId = variant?.id || 'base';

  return {
    ...product,
    price: finalPrice,
    productId: product.id,
    cartKey: `${product.id}::${variantId}`,
    variantId: variant?.id || '',
    variantName: variant?.name || '',
    variantName_zh: variant?.name_zh || '',
    image: variantImages[0] || product.image,
    selectedVariant: variant
      ? {
          id: variant.id,
          name: variant.name,
          name_zh: variant.name_zh,
          price: variant.price,
          image: variant.image,
          images: variant.images,
        }
      : null,
  };
};
