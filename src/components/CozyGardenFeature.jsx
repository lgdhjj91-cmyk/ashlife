import React from 'react';
import { ArrowUpRight, Leaf, Gift, MapPin, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { COZY_GARDEN_URL, gardenPromotionCopy } from '../joy/gardenPromotion';
import './CozyGardenFeature.css';

export default function CozyGardenFeature({ compact = false }) {
  const { language } = useLanguage();
  const copy = gardenPromotionCopy[language] || gardenPromotionCopy.en;
  const zh = language === 'zh';
  return <section className={`cozy-garden-feature${compact ? ' cozy-garden-feature--compact' : ''}`} aria-label="Cozy Garden">
    {!compact && <div className="cozy-garden-scene"><img src={`${import.meta.env.BASE_URL}assets/playroom/cozy-garden/gameplay.png`} alt={copy.alt} width="1440" height="960" loading="lazy" /><span><Leaf size={15} />Cozy Garden</span></div>}
    <div className="cozy-garden-content">
      <span className="cozy-garden-eyebrow"><Leaf size={16} />{copy.eyebrow}</span>
      <h2>{compact ? 'Cozy Garden' : copy.title}</h2>
      {!compact && <p className="cozy-garden-description">{copy.description}</p>}
      <div className="cozy-garden-exclusive"><Gift size={23} aria-hidden="true" /><div><span>{copy.exclusive}</span><h3>{copy.gift}</h3><p>{copy.giftDescription}</p></div></div>
      <span className="cozy-garden-status">{copy.rewardsStatus}</span>
      {!compact && <ol className="cozy-garden-steps">{copy.steps.map(step => <li key={step}>{step}</li>)}</ol>}
      <div className="cozy-garden-actions"><a href={COZY_GARDEN_URL} target="_blank" rel="noopener noreferrer">{copy.play}<ArrowUpRight size={19} /></a><small>{copy.newTab}</small></div>
      <p className="cozy-garden-terms">{copy.terms}</p>
      <div className="cozy-garden-fulfillment"><span><MapPin size={16} />{zh ? 'Seri Kembangan 自取 · 现有款式可选' : 'Seri Kembangan pickup · Choose available designs'}</span><span><Truck size={16} />{zh ? '寄送 · 随机款式' : 'Delivery · Random design'}</span></div>
    </div>
  </section>;
}
