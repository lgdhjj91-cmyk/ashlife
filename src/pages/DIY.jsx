import React, { useState } from 'react';
import {
  BadgeCheck,
  Car,
  CheckCircle2,
  Image as ImageIcon,
  MessageCircle,
  RectangleVertical,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './DIY.css';

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '60123456789';
const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

const PRODUCTS = [
  {
    id: 'badge',
    icon: BadgeCheck,
    tab: { en: 'Custom Badge', zh: '定制徽章' },
    kicker: { en: 'Custom merch · 25mm round badge', zh: '定制周边 · 25mm 圆形徽章' },
    title: { en: 'Custom Badge', zh: '定制徽章' },
    subtitle: { en: '25mm pin button badge', zh: '25mm 圆形别针徽章' },
    badge: { en: 'Min 5 pcs', zh: '5 件起订' },
    description: {
      en: 'Make your own small round badges with photos, fan art, logos or character designs. The finished badge has a glossy front and pin-back, suitable for gifts, event souvenirs and small merch runs.',
      zh: '可把照片、同人图、LOGO 或角色图案做成小圆形徽章。成品正面亮面，背面带别针，适合礼物、活动小周边或少量定制。',
    },
    price: {
      label: { en: 'Promo price / pc', zh: '优惠价 / 件' },
      value: 'RM 3.00',
      original: 'RM 5.00',
      note: { en: 'Minimum order: 5 pieces', zh: '最低起订量：5 件' },
    },
    specs: {
      en: [
        'Size: 25mm round badge',
        'Minimum order: 5 pieces',
        'Custom artwork accepted in PNG or JPG',
        'Glossy print with pin-back',
        'Good for gifts, events and fan merch',
      ],
      zh: [
        '尺寸：25mm 圆形徽章',
        '最低起订量：5 件',
        '接受 PNG 或 JPG 定制图案',
        '亮面印刷，背面带别针',
        '适合礼物、活动和粉丝周边',
      ],
    },
    steps: {
      en: [
        ['Contact us', 'Tell us your quantity and send your design idea.'],
        ['Send artwork', 'Share a clear PNG or JPG file for checking.'],
        ['Confirm preview', 'We confirm layout, price and collection or delivery.'],
        ['Make and collect', 'Production starts after confirmation and payment.'],
      ],
      zh: [
        ['联系下单', '告诉我们数量，并发送想做的图案。'],
        ['提交图档', '发送清晰 PNG 或 JPG 文件给我们确认。'],
        ['确认预览', '确认排版、价格以及自取或寄送方式。'],
        ['制作取货', '确认付款后安排制作。'],
      ],
    },
    media: [
      { type: 'image', src: asset('diy/badge-display-1.jpg'), alt: 'ASHLIFE custom badge display' },
      { type: 'image', src: asset('diy/badge-display-2.jpg'), alt: 'Custom badge display tray' },
      {
        type: 'image',
        srcByLang: { en: asset('diy/badge-info-en.svg'), zh: asset('diy/badge-info-zh.svg') },
        alt: '25mm custom badge info card',
      },
      { type: 'image', src: asset('diy/badge-back.webp'), alt: 'Badge pin-back sample' },
    ],
  },
  {
    id: 'keychain',
    icon: RectangleVertical,
    tab: { en: 'Rectangle Keychain', zh: '长方形钥匙扣' },
    kicker: { en: 'Custom merch · rectangle acrylic keychain', zh: '定制周边 · 长方形亚克力钥匙扣' },
    title: { en: 'Custom Rectangle Keychain', zh: '定制长方形钥匙扣' },
    subtitle: { en: 'Fixed rectangle size', zh: '固定长方形款式' },
    badge: { en: 'Min 5 pcs', zh: '5 件起订' },
    description: {
      en: 'This keychain is the rectangle acrylic style only. Add your photo, quote, cartoon art or character image inside the clear case for a small custom gift or display item.',
      zh: '钥匙扣目前固定为长方形亚克力款。可放入照片、文字、卡通图或角色图案，适合做小礼物、挂件或展示款。',
    },
    price: {
      label: { en: 'Same promo price / pc', zh: '同款优惠价 / 件' },
      value: 'RM 3.00',
      original: 'RM 5.00',
      note: { en: 'Minimum order: 5 pieces', zh: '最低起订量：5 件' },
    },
    specs: {
      en: [
        'Shape: rectangle only',
        'Outer size: 3.4cm x 5.2cm',
        'Inner artwork range: 2.8cm x 4.5cm',
        'Minimum order: 5 pieces',
        'Comes with metal keyring loop',
      ],
      zh: [
        '款式：只做长方形',
        '外尺寸：3.4cm x 5.2cm',
        '内图范围：2.8cm x 4.5cm',
        '最低起订量：5 件',
        '附金属钥匙圈',
      ],
    },
    steps: {
      en: [
        ['Choose quantity', 'Start from 5 pieces and tell us the artwork direction.'],
        ['Send artwork', 'Use a clear vertical image for best results.'],
        ['Confirm layout', 'We check the rectangle crop before making.'],
        ['Make and pack', 'Finished keychains are packed for pickup or delivery.'],
      ],
      zh: [
        ['选择数量', '5 件起订，并告诉我们想做的图案方向。'],
        ['发送图档', '建议使用清晰直版图片，效果更好。'],
        ['确认排版', '制作前确认长方形裁切范围。'],
        ['制作包装', '完成后安排自取或寄送。'],
      ],
    },
    media: [
      { type: 'image', src: asset('diy/keychain-display.jpg'), alt: 'ASHLIFE rectangle keychain display' },
      { type: 'image', src: asset('diy/keychain-closeup.jpg'), alt: 'Rectangle keychain close up' },
      { type: 'image', src: asset('diy/keychain-size.png'), alt: 'Rectangle keychain size guide' },
    ],
  },
  {
    id: 'ornament',
    icon: Car,
    tab: { en: 'Shaking Ornament', zh: '摇摇乐摆件' },
    kicker: { en: 'Custom decoration · shaking head stand', zh: '定制摆件 · 摇头摇摇乐' },
    title: { en: 'Shaking Ornament', zh: '摇摇乐 / 摇头摆件' },
    subtitle: { en: 'For car dashboard, desk or shelf', zh: '车内、桌面、层架都适合' },
    badge: { en: 'RM20 each', zh: 'RM20 / 个' },
    description: {
      en: 'Turn a photo or character into a moving head decoration. The acrylic printed body sits on a spring mechanism so it shakes when placed in the car, on a desk or on a shelf.',
      zh: '把照片或角色做成会摇头的小摆件。亚克力彩印主体搭配弹簧结构，放在车内、桌面或层架上都很有纪念感。',
    },
    price: {
      label: { en: 'Price / pc', zh: '价格 / 个' },
      value: 'RM 20.00',
      note: { en: 'Minimum order: 1 piece', zh: '最低起订量：1 个' },
    },
    specs: {
      en: [
        'Minimum order: 1 piece',
        'Approx size: 10cm',
        'Acrylic print with spring shaking head structure',
        'AAA battery model, batteries not included',
        'Good for car, home and office decoration',
      ],
      zh: [
        '最低起订量：1 个',
        '大约尺寸：10cm',
        '亚克力彩印，弹簧摇头结构',
        'AAA 电池款，不包含电池',
        '适合车内、家里或办公室摆放',
      ],
    },
    steps: {
      en: [
        ['Send reference', 'Share the photo, character or custom idea.'],
        ['Confirm style', 'We check the shape, body and head layout.'],
        ['Approve proof', 'Confirm the preview and make payment.'],
        ['Ready to shake', 'Place it on your dashboard, desk or shelf.'],
      ],
      zh: [
        ['发送参考', '提供照片、角色或想做的创意。'],
        ['确认款式', '确认造型、身体和头部排版。'],
        ['确认预览', '预览确认并付款后开始制作。'],
        ['开始摇摇', '完成后可放车内、桌面或层架。'],
      ],
    },
    media: [
      {
        type: 'video',
        src: asset('diy/ornament-demo.mp4'),
        poster: asset('diy/ornament-dashboard.webp'),
        alt: 'Shaking ornament demo video',
      },
      { type: 'image', src: asset('diy/ornament-dashboard.webp'), alt: 'Custom shaking ornament on dashboard' },
      { type: 'image', src: asset('diy/ornament-couple.webp'), alt: 'Couple shaking ornament sample' },
      {
        type: 'image',
        srcByLang: { en: asset('diy/ornament-details-en.svg'), zh: asset('diy/ornament-details.jpg') },
        alt: 'Shaking ornament structure comparison',
      },
    ],
  },
  {
    id: 'frame',
    icon: ImageIcon,
    tab: { en: 'AI Cartoon Portrait', zh: 'AI 卡通相框' },
    kicker: { en: 'Photo frame · custom AI cartoon portrait', zh: '相框定制 · AI 卡通人像' },
    title: { en: 'Photo Frames Custom AI Cartoon Portraits', zh: 'AI 卡通人像相框定制' },
    subtitle: { en: 'Photo generation, print and frame', zh: '生成、打印、相框装裱' },
    badge: { en: 'New', zh: '新品' },
    description: {
      en: 'Send a real photo and choose a visual style. We create an upgraded AI cartoon portrait, print it on 15cm x 22cm photo paper, include the soft copy and place it in a frame.',
      zh: '发送真实照片并选择喜欢的风格，我们会生成升级版 AI 卡通人像，使用 15cm x 22cm 相纸打印，提供电子图，并附相框装裱。',
    },
    price: {
      label: { en: 'Price / set', zh: '价格 / 套' },
      value: 'RM 20.00',
      note: { en: 'Minimum order: 1 set', zh: '最低起订量：1 套' },
    },
    specs: {
      en: [
        'Minimum order: 1 set',
        '15cm x 22cm high-quality photo print',
        'Frame included',
        'Soft copy included',
        'One free style revision',
      ],
      zh: [
        '最低起订量：1 套',
        '15cm x 22cm 高质相纸打印',
        '包含相框',
        '包含电子图',
        '免费改风格一次',
      ],
    },
    steps: {
      en: [
        ['Send photo', 'WhatsApp us a clear face photo.'],
        ['Pick style', 'Choose anime, watercolor, retro, 3D, guochao and more.'],
        ['Generate and revise', 'We generate the portrait and include one style revision.'],
        ['Print and frame', 'Your portrait is printed, framed and ready to gift.'],
      ],
      zh: [
        ['发送照片', '通过 WhatsApp 发送清晰人像照片。'],
        ['选择风格', '可选动漫、水彩、复古、3D、国潮等风格。'],
        ['生成修改', '生成后可免费改风格一次。'],
        ['打印装框', '完成后打印并装入相框，适合送礼。'],
      ],
    },
    media: [
      { type: 'frame-visual', alt: 'AI cartoon portrait frame mockup' },
      { type: 'image', src: asset('diy/ai-before-1.jpg'), alt: 'Original portrait before AI cartoon generation' },
      { type: 'image', src: asset('diy/ai-after-anime.jpg'), alt: 'Anime cartoon portrait sample' },
      { type: 'image', src: asset('diy/ai-after-watercolor.jpg'), alt: 'Watercolor cartoon portrait sample' },
      { type: 'image', src: asset('diy/ai-after-3d.jpg'), alt: '3D cartoon portrait sample' },
      { type: 'image', src: asset('diy/ai-after-ghibli.jpg'), alt: 'Soft illustrated cartoon portrait sample' },
    ],
  },
];

function buildWaLink(product, lang) {
  const text =
    lang === 'zh'
      ? `你好 ASHLIFE！我想订制 ${product.title.zh}。\n\n请问我可以怎样提交照片/图案？数量和交货时间也麻烦一起告诉我，谢谢！`
      : `Hello ASHLIFE! I am interested in ordering ${product.title.en}.\n\nCould you share how to submit my photo/artwork, the quantity details and estimated delivery time? Thank you!`;

  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

function ProductMedia({ media, title, language }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = media[activeIndex] ?? media[0];

  return (
    <div className="diy-product-media" aria-label={title}>
      <div className="diy-media-main">
        <MediaItem item={activeItem} isPrimary language={language} />
      </div>

      {media.length > 1 && (
        <div className="diy-media-strip">
          {media.map((item, index) => (
            <button
              type="button"
              className={`diy-media-thumb${activeIndex === index ? ' active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${item.alt || title}`}
              aria-pressed={activeIndex === index}
              key={`${item.type}-${index}`}
            >
              <MediaItem item={item} language={language} isThumbnail />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function mediaSrc(item, language, field = 'src') {
  const languageKey = language === 'zh' ? 'zh' : 'en';
  return item[`${field}ByLang`]?.[languageKey] ?? item[field];
}

function MediaItem({ item, isPrimary = false, isThumbnail = false, language }) {
  const src = mediaSrc(item, language);
  const poster = mediaSrc(item, language, 'poster');

  if (item.type === 'video') {
    if (isThumbnail) {
      return <img src={poster} alt={item.alt} loading="lazy" />;
    }

    return (
      <video
        src={src}
        poster={poster}
        controls
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={item.alt}
      />
    );
  }

  if (item.type === 'frame-visual') {
    return <FrameVisual language={language} />;
  }

  return <img src={src} alt={item.alt} loading={isPrimary ? 'eager' : 'lazy'} />;
}

function FrameVisual({ language }) {
  return (
    <div className="diy-frame-visual">
      <div className="diy-frame-card">
        <div className="diy-frame-mat">
          <div className="diy-cartoon-portrait">
            <div className="portrait-sun" />
            <div className="portrait-face" />
            <div className="portrait-hair" />
            <div className="portrait-body" />
            <div className="portrait-camera" />
          </div>
        </div>
      </div>
      <div className="diy-frame-copy">
        <span>{language === 'zh' ? '15 x 22cm 相纸' : '15 x 22cm print'}</span>
        <strong>RM20</strong>
        <span>{language === 'zh' ? '包含相框 + 电子图' : 'Frame + soft copy included'}</span>
      </div>
    </div>
  );
}

function PriceCard({ price, language }) {
  const l = language === 'zh' ? 'zh' : 'en';

  return (
    <div className={`diy-price-card${price.original ? ' has-discount' : ''}`}>
      {price.original && (
        <>
          <div className="diy-price-row">
            <span className="diy-price-label">{language === 'zh' ? '原价 / 件' : 'Original price / pc'}</span>
            <span className="diy-price-original">{price.original}</span>
          </div>
          <div className="diy-price-divider" />
        </>
      )}
      <div className="diy-price-row">
        <span className="diy-price-label strong">{price.label[l]}</span>
        <span className="diy-price-now">{price.value}</span>
      </div>
      <div className="diy-price-note">{price.note[l]}</div>
    </div>
  );
}

function DIYProductTab({ product, language }) {
  const l = language === 'zh' ? 'zh' : 'en';

  return (
    <div className="diy-tab-content">
      <div className="diy-product-layout">
        <div className="diy-product-image-wrap">
          <ProductMedia media={product.media} title={product.title[l]} language={language} />
          <span className="diy-product-image-badge">{product.badge[l]}</span>
        </div>

        <div className="diy-product-info">
          <p className="diy-product-kicker">{product.kicker[l]}</p>
          <h2>
            {product.title[l]}
            <span className="zh-subtitle">{product.subtitle[l]}</span>
          </h2>
          <p className="diy-product-desc">{product.description[l]}</p>

          <PriceCard price={product.price} language={language} />

          <ul className="diy-specs-list">
            {product.specs[l].map((spec) => (
              <li key={spec}>
                <CheckCircle2 size={16} />
                {spec}
              </li>
            ))}
          </ul>

          <div className="diy-order-cta">
            <a
              href={buildWaLink(product, language)}
              target="_blank"
              rel="noopener noreferrer"
              className="diy-whatsapp-btn"
            >
              <MessageCircle size={20} />
              {language === 'zh' ? 'WhatsApp 立即询问' : 'Order via WhatsApp'}
            </a>
            <p className="diy-cta-note">
              {language === 'zh'
                ? '发送照片或图案后，我们会确认排版、数量和交货时间。'
                : 'Send your photo or artwork and we will confirm layout, quantity and timing.'}
            </p>
          </div>
        </div>
      </div>

      <div className="diy-how-section">
        <h3>{language === 'zh' ? '如何订制' : 'How to Order'}</h3>
        <div className="diy-steps">
          {product.steps[l].map(([title, desc], index) => (
            <div className="diy-step" key={title}>
              <div className="diy-step-num">{index + 1}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const DIY = () => {
  const [activeTab, setActiveTab] = useState(PRODUCTS[0].id);
  const { language } = useLanguage();
  const l = language === 'zh' ? 'zh' : 'en';
  const activeProduct = PRODUCTS.find((product) => product.id === activeTab) ?? PRODUCTS[0];

  return (
    <div className="page container animate-fade-in diy-page">
      <div className="diy-hero">
        <div className="diy-hero-inner">
          <div className="diy-hero-kicker">
            <Sparkles size={13} />
            {language === 'zh' ? 'ASHLIFE 定制服务' : 'ASHLIFE DIY Custom Studio'}
          </div>
          <h1>
            {language === 'zh' ? (
              <>
                把你的照片和创意<span>做成实物</span>
              </>
            ) : (
              <>
                Turn Your Ideas Into <span>Real Products</span>
              </>
            )}
          </h1>
          <p>
            {language === 'zh'
              ? '徽章、长方形钥匙扣、摇摇乐摆件和 AI 卡通相框，都可以从照片或图案开始，通过 WhatsApp 联系即可确认定制细节。'
              : 'Custom badges, rectangle keychains, shaking ornaments and AI cartoon portrait frames, all starting from your photo or artwork. Message us on WhatsApp to confirm the details.'}
          </p>
          <div className="diy-hero-badge">
            {language === 'zh'
              ? '徽章 / 钥匙扣 RM3 起，摇摇乐 / AI 相框 RM20 起'
              : 'Badges / keychains from RM3, ornaments / AI frames from RM20'}
          </div>
        </div>
      </div>

      <div className="diy-tabs-nav" role="tablist" aria-label="DIY product categories">
        {PRODUCTS.map((product) => {
          const Icon = product.icon;
          return (
            <button
              key={product.id}
              id={`diy-tab-${product.id}`}
              role="tab"
              aria-selected={activeTab === product.id}
              aria-controls={`diy-panel-${product.id}`}
              className={`diy-tab-btn${activeTab === product.id ? ' active' : ''}`}
              onClick={() => setActiveTab(product.id)}
            >
              <Icon size={18} />
              {product.tab[l]}
            </button>
          );
        })}
      </div>

      {PRODUCTS.map((product) => (
        <div
          id={`diy-panel-${product.id}`}
          role="tabpanel"
          aria-labelledby={`diy-tab-${product.id}`}
          hidden={activeTab !== product.id}
          key={product.id}
        >
          {activeProduct.id === product.id && <DIYProductTab product={activeProduct} language={language} />}
        </div>
      ))}
    </div>
  );
};

export default DIY;
