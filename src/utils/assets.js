export const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${import.meta.env.BASE_URL}${String(url).replace(/^\//, '')}`;
};
