export const imageFallbackUrl = `${import.meta.env.BASE_URL}brand/ashlife-logo.webp`;

const optimizeCloudinaryUrl = (url) => {
  if (!/res\.cloudinary\.com\/.+\/image\/upload\//i.test(url)) return url;
  const [prefix, suffix] = url.split('/image/upload/');
  if (!suffix || /^([^/]*,)?(f_auto|q_auto)/.test(suffix) || suffix.includes('/f_auto') || suffix.includes('/q_auto')) {
    return url;
  }
  return `${prefix}/image/upload/f_auto,q_auto/${suffix}`;
};

export const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (/^(data:|blob:)/i.test(url)) return url;
  if (/^https?:/i.test(url)) return optimizeCloudinaryUrl(url);
  if (String(url).startsWith(import.meta.env.BASE_URL)) return url;
  return `${import.meta.env.BASE_URL}${String(url).replace(/^\//, '')}`;
};

export const handleImageFallback = (event) => {
  if (event.currentTarget.src.endsWith('/brand/ashlife-logo.webp')) return;
  event.currentTarget.src = imageFallbackUrl;
  event.currentTarget.classList.add('image-fallback');
};
