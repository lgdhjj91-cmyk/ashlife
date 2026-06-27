import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, get } from 'firebase/database';

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export const DEFAULT_SITE_CONTENT = {
  categories: [
    {
      id: 'home-gadgets',
      en: 'Home Gadgets',
      zh: '家居小物',
      description_en: 'Hook-and-loop, cable care and desk tidy tools',
      description_zh: '魔术贴、电线收纳、桌面整理',
      showInRange: true,
      icon: 'cable',
    },
    {
      id: 'cleaning-tools',
      en: 'Cleaning Tools',
      zh: '家居厨房',
      description_en: 'Kitchen, cleaning and home helper items',
      description_zh: '厨房、清洁、家居小工具',
      showInRange: true,
      icon: 'home',
    },
    {
      id: 'diy-crafts',
      en: 'DIY Crafts',
      zh: 'DIY 手作',
      description_en: 'Resin, craft and kids creative supplies',
      description_zh: '树脂、手作、儿童创意材料',
      showInRange: true,
      icon: 'paintbrush',
    },
    {
      id: 'stationery',
      en: 'Stationery',
      zh: '文具',
      description_en: 'Memo pads, pens, study and office supplies',
      description_zh: '便签、笔类、学习与办公用品',
      showInRange: true,
      icon: 'sparkles',
    },
    {
      id: 'cute-accessories',
      en: 'Cute Accessories',
      zh: '可爱配件',
      description_en: 'Cute accessories and small gifts',
      description_zh: '可爱配件与小礼品',
      showInRange: false,
      icon: 'sparkles',
    },
    {
      id: 'lifestyle-items',
      en: 'Lifestyle Items',
      zh: '生活用品',
      description_en: 'Daily lifestyle helpers',
      description_zh: '日常生活小帮手',
      showInRange: false,
      icon: 'home',
    },
    {
      id: 'festival-items',
      en: 'Festival Items',
      zh: '节日用品',
      description_en: 'Seasonal and festive items',
      description_zh: '节日与季节商品',
      showInRange: false,
      icon: 'sparkles',
    },
  ],
  homeFocusProductIds: [
    'hook-loop-cable-tie-roll',
    'self-adhesive-hook-loop-tape',
    'silicone-garlic-peeler-set',
    'webcam-privacy-cover',
  ],
  creativeRootsImages: [
    {
      src: asset('/brand/shop-product-2-optimized.webp'),
      alt: 'ASHLIFE creative shop display with cute gifts and nano bricks',
    },
    {
      src: asset('/brand/craft-feature-1-optimized.webp'),
      alt: 'Super cute creative collection poster',
    },
    {
      src: asset('/brand/craft-feature-2-optimized.webp'),
      alt: 'DIY craft supply poster',
    },
  ],
  archiveImages: [
    {
      src: asset('/brand/shop-poster-optimized.webp'),
      alt: 'ASHLIFE kawaii superstore opening sale poster',
    },
    {
      src: asset('/brand/shop-product-2-optimized.webp'),
      alt: 'Creative mini figures, stationery and nano brick items',
    },
  ],
  diyMedia: {},
};

const SiteContentContext = createContext();

const mergeSiteContent = (incoming = {}) => ({
  ...DEFAULT_SITE_CONTENT,
  ...incoming,
  categories: incoming.categories?.length ? incoming.categories : DEFAULT_SITE_CONTENT.categories,
  homeFocusProductIds: incoming.homeFocusProductIds?.length
    ? incoming.homeFocusProductIds
    : DEFAULT_SITE_CONTENT.homeFocusProductIds,
  creativeRootsImages: incoming.creativeRootsImages?.length
    ? incoming.creativeRootsImages
    : DEFAULT_SITE_CONTENT.creativeRootsImages,
  archiveImages: incoming.archiveImages?.length ? incoming.archiveImages : DEFAULT_SITE_CONTENT.archiveImages,
  diyMedia: incoming.diyMedia || DEFAULT_SITE_CONTENT.diyMedia,
});

export const useSiteContent = () => useContext(SiteContentContext);

export const SiteContentProvider = ({ children }) => {
  const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT);
  const [loadingSiteContent, setLoadingSiteContent] = useState(true);

  useEffect(() => {
    const contentRef = ref(database, 'settings/siteContent');
    const unsubscribe = onValue(
      contentRef,
      (snapshot) => {
        const merged = mergeSiteContent(snapshot.val() || {});
        setSiteContent(merged);
        localStorage.setItem('ashlife_site_content', JSON.stringify(merged));
        setLoadingSiteContent(false);
      },
      (error) => {
        console.error('Site content subscription error:', error);
        const cached = localStorage.getItem('ashlife_site_content');
        if (cached) {
          try {
            setSiteContent(mergeSiteContent(JSON.parse(cached)));
          } catch (parseError) {
            console.error('Failed to parse cached site content:', parseError);
          }
        }
        setLoadingSiteContent(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSiteContent = useCallback(async (data) => {
    try {
      const contentRef = ref(database, 'settings/siteContent');
      const snapshot = await get(contentRef);
      const current = snapshot.val() || {};
      const nextContent = mergeSiteContent({ ...current, ...data });
      await set(contentRef, nextContent);
      return { success: true };
    } catch (error) {
      console.error('Failed to update site content:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return (
    <SiteContentContext.Provider value={{ siteContent, loadingSiteContent, updateSiteContent }}>
      {children}
    </SiteContentContext.Provider>
  );
};
