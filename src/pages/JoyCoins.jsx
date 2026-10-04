import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import JoyRewardsPanel from '../components/JoyRewardsPanel';
import { useLanguage } from '../context/LanguageContext';
import './JoyCoins.css';

export default function JoyCoins() {
  const { language } = useLanguage();
  const zh = language === 'zh';
  return <main className="joy-coins-page"><div className="container">
    <div className="joy-coins-navigation"><Link to="/play/"><ArrowLeft size={17} />{zh ? '返回游戏室' : 'Back to Playroom'}</Link><Link to="/shop">{zh ? '逛商店' : 'Shop now'} →</Link></div>
    <header className="joy-coins-hero"><span>{zh ? '你的欢乐小钱包' : 'Your little wallet of joy'}</span><h1>Joy Coins</h1><p>{zh ? '查看金币、兑换礼物，所有奖励代码和记录都在这里。' : 'Your coins, your gifts, and every reward code. All in one happy place.'}</p></header>
    <JoyRewardsPanel standalone />
    <Link to="/play/" className="joy-coins-play"><Gamepad2 size={22} />{zh ? '继续玩游戏，赚取更多金币' : 'Keep playing. Your next gift is getting closer.'} →</Link>
  </div></main>;
}
