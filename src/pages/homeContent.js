import {
  Cable,
  Gift,
  Home,
  Sparkles,
  Store,
  Utensils,
} from 'lucide-react';
import { normalizeVariants } from '../utils/productVariants.js';

export const HOME_CATEGORIES = [
  {
    key: 'home',
    icon: Home,
    labelEn: 'Home Essentials',
    labelZh: '家居实用',
    to: '/shop?category=Home%20Gadgets',
  },
  {
    key: 'cable',
    icon: Cable,
    labelEn: 'Cable Management',
    labelZh: '电线收纳',
    to: '/shop?search=cable',
  },
  {
    key: 'kitchen',
    icon: Utensils,
    labelEn: 'Kitchen Helpers',
    labelZh: '厨房小帮手',
    to: '/shop?category=Cleaning%20Tools',
  },
  {
    key: 'diy',
    icon: Sparkles,
    labelEn: 'DIY & Craft',
    labelZh: 'DIY 手作',
    to: '/shop?category=DIY%20Crafts',
  },
  {
    key: 'toys',
    icon: Store,
    labelEn: 'Toys',
    labelZh: '玩具小物',
    to: '/shop?search=toy',
  },
  {
    key: 'gifts',
    icon: Gift,
    labelEn: 'Gifts & Small Items',
    labelZh: '礼品小物',
    to: '/shop?category=Cute%20Accessories',
  },
];

const HOME_COPY = {
  en: {
    hero: {
      eyebrow: 'Ready stock in Malaysia',
      title: 'Useful little things for everyday life',
      subtitle: 'Shop practical home, work, kitchen and DIY finds, ready for delivery or pickup.',
      primaryAction: 'Shop Products',
      secondaryAction: 'View Shopee',
    },
    categories: {
      title: 'Shop by category',
    },
    products: {
      title: 'Popular now',
      description: 'Useful picks customers are browsing now.',
      action: 'View All Products',
      empty: 'Products are being updated. Browse the full catalogue for the latest items.',
    },
    ordering: {
      title: 'Easy ways to receive your order',
      description: 'Choose delivery, pickup or WhatsApp confirmation at checkout.',
      points: [
        'Ready stock in Malaysia',
        'Pickup nearby',
        'Delivery available',
        'WhatsApp confirmation',
      ],
    },
    playroom: {
      eyebrow: 'Play & Win',
      title: 'Take a quick play break',
      description: 'Match stickers, play the claw machine and collect cute rewards.',
      action: 'Start Playing',
    },
    closing: {
      title: 'Ready to find something useful?',
      primaryAction: 'Shop Products',
      secondaryAction: 'WhatsApp',
    },
  },
  zh: {
    hero: {
      eyebrow: '马来西亚现货',
      title: '为日常生活找到实用小物',
      subtitle: '选购家居、办公、厨房和 DIY 实用商品，可安排配送或自取。',
      primaryAction: '选购商品',
      secondaryAction: '查看 Shopee',
    },
    categories: {
      title: '按分类选购',
    },
    products: {
      title: '近期热门',
      description: '看看顾客最近关注的实用商品。',
      action: '查看全部商品',
      empty: '商品正在更新中，请浏览完整目录查看最新商品。',
    },
    ordering: {
      title: '轻松选择收货方式',
      description: '结账时可选择配送、自取或 WhatsApp 确认。',
      points: ['马来西亚现货', '附近自取', '可安排配送', 'WhatsApp 确认'],
    },
    playroom: {
      eyebrow: '玩游戏赢奖励',
      title: '来玩一个轻松小游戏',
      description: '配对贴纸、挑战抓娃娃机并收集可爱奖励。',
      action: '开始玩',
    },
    closing: {
      title: '准备寻找实用好物了吗？',
      primaryAction: '选购商品',
      secondaryAction: 'WhatsApp',
    },
  },
};

const productHasStock = (product) => {
  const variants = normalizeVariants(product);
  if (variants.length > 0) {
    return variants.some((variant) => Number(variant.stock) > 0);
  }

  return Number(product.stock) > 0;
};

export const getHomeCopy = (language) => HOME_COPY[language] || HOME_COPY.en;

export const selectHomepageProducts = (products = [], focusIds = [], limit = 4) => {
  const configured = focusIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean);
  const flagged = products.filter(
    (product) => product.bestSeller || product.popular || product.featured
  );
  const inStock = products.filter(productHasStock);
  const seen = new Set();

  return [...configured, ...flagged, ...inStock, ...products]
    .filter((product) => {
      if (!product || seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    })
    .slice(0, limit);
};
