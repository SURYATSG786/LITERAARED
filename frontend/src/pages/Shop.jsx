import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Gem,
  Flame,
  ShieldCheck,
  Check,
  Lock,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { RedBird, GuideBird, BIRD_SKINS } from '../components/RedBird';
import api from '../api/client';

export default function Shop() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();

  const [loadingAction, setLoadingAction] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const userGems = user?.gems || 0;
  const equippedSkin = user?.equipped_skin || 'classic';
  const unlockedSkins = user?.unlocked_skins || ['classic'];
  const streakSavers = user?.streak_savers || 0;
  const currentStreak = user?.streak?.current || 0;

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setFeedbackMessage(null);
    } else {
      setFeedbackMessage(msg);
      setErrorMessage(null);
    }
    setTimeout(() => {
      setFeedbackMessage(null);
      setErrorMessage(null);
    }, 4500);
  };

  const handleBuyStreakSaver = async () => {
    if (userGems < 25) {
      showNotification(
        t('notEnoughGemsStreakSaver', 'You need 25 gems to buy a Streak Saver! Complete lessons or voice practices to earn more gems.'),
        true
      );
      return;
    }

    setLoadingAction('streak_saver');
    try {
      const res = await api.buyStreakSaver();
      if (res.user) refreshUser(res.user);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      showNotification(t('streakSaverBoughtSuccess', 'Streak Saver purchased successfully! Your streak is protected. 🛡️🔥'));
    } catch (err) {
      showNotification(err.message || t('purchaseFailed', 'Purchase failed. Please try again.'), true);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSkinAction = async (skinId, price) => {
    const isUnlocked = unlockedSkins.includes(skinId);
    const isEquipped = equippedSkin === skinId;

    if (isEquipped) return;

    setLoadingAction(skinId);
    try {
      if (isUnlocked) {
        // Equip skin
        const res = await api.equipSkin(skinId);
        if (res.user) refreshUser(res.user);
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
        showNotification(t('skinEquippedSuccess', 'Bird skin equipped successfully! ✨'));
      } else {
        // Purchase & Equip skin
        if (userGems < price) {
          showNotification(
            t('notEnoughGemsSkin', 'You need {{price}} gems to unlock this skin! Keep practicing to earn gems.', { price }),
            true
          );
          return;
        }
        const res = await api.buySkin(skinId);
        if (res.user) refreshUser(res.user);
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
        showNotification(t('skinUnlockedSuccess', 'Congratulations! New Bird skin unlocked and equipped! 🎉'));
      }
    } catch (err) {
      showNotification(err.message || t('actionFailed', 'Action failed. Please try again.'), true);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-2.5 sm:gap-3 p-1 sm:p-1.5 pb-2 min-h-0">
      {/* Top Banner Guide (Placed exactly like in other pages at the top-right) */}
      <div className="flex items-center justify-end shrink-0 mb-0.5">
        <GuideBird
          message={t('shopBirdTip', 'Welcome to the Shop! Missed a day? Use Streak Saver to keep your progress safe, or customize my feather colors!')}
          mood="cheer"
          size={42}
        />
      </div>

      {/* Top Title & User Currency Header - Full Width */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4 sm:p-5 rounded-3xl border-2 border-amber-300/60 shadow-lg shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center border border-amber-400/40 shrink-0">
              <ShoppingBag size={20} className="text-amber-700" />
            </div>
            <h1 className="display text-xl sm:text-2xl font-black text-[#032038]">
              {t('shopTitle', 'LiteraAI Shop')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#032038]/70 max-w-2xl">
            {t('shopSubtitle', 'Spend your earned gems on power-ups, customizations, and streak shields!')}
          </p>
        </div>

        {/* Currency & Streaks Showcase Badges */}
        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-sky-500/15 border-2 border-sky-400/60 shadow-xs backdrop-blur-md">
            <Gem size={22} className="text-sky-600 fill-sky-400 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-900/70 leading-none mb-0.5">{t('gems', 'Gems')}</span>
              <span className="text-base sm:text-lg font-black text-sky-950 leading-none">{userGems}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border-2 border-amber-400/60 shadow-xs backdrop-blur-md">
            <Flame size={22} className="text-amber-600 fill-amber-500" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/70 leading-none mb-0.5">{t('streak', 'Streak')}</span>
              <span className="text-base sm:text-lg font-black text-amber-950 leading-none">{currentStreak} {t('days', 'd')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/60 p-3 text-emerald-950 font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-md shrink-0"
          >
            <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
            <span>{feedbackMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl bg-rose-500/15 border-2 border-rose-500/60 p-3 text-rose-950 font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-md shrink-0"
          >
            <Info size={18} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. STREAK SAVER FEATURE CARD - Full Width */}
      <motion.div
        className="w-full glass-card rounded-3xl p-4 sm:p-5 border-2 border-amber-300/80 shadow-xl overflow-hidden relative shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 251, 235, 0.98) 0%, rgba(254, 243, 199, 0.92) 100%)',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4.5 w-full md:w-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-lg border-2 border-amber-300 shrink-0">
              <div className="relative flex items-center justify-center">
                <ShieldCheck size={36} className="text-white drop-shadow-md" />
                <Flame size={18} className="absolute text-yellow-200 fill-yellow-300 -top-1 -right-1 animate-bounce" />
              </div>
            </div>

            <div className="space-y-1 text-left flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="display text-base sm:text-lg font-black text-amber-950">
                  {t('streakSaverTitle', 'Streak Saver')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 border border-amber-500/40 text-xs font-black">
                  25 💎
                </span>
                {streakSavers > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-900 border border-emerald-500/40 text-xs font-black flex items-center gap-1">
                    <Check size={12} />
                    {t('streakSaversActiveCount', 'Owned: {{count}}', { count: streakSavers })}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-bold text-amber-900/85 leading-relaxed max-w-2xl">
                {t('streakSaverDesc', 'Missed a day? Spend 25 💎 to keep your streak. Very useful and gives diamonds real value.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBuyStreakSaver}
            disabled={loadingAction === 'streak_saver'}
            className="btn-primary w-full md:w-auto px-5 sm:px-6 py-2.5 sm:py-3 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-102 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShieldCheck size={18} />
            <span>{t('buyStreakSaverBtn', 'Buy Streak Saver (25 💎)')}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>

      {/* 2. UNLOCK BIRD SKINS SECTION - Full Width Balanced Grid */}
      <div className="w-full space-y-2.5 sm:space-y-3 flex-1 flex flex-col justify-between min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 shrink-0">
          <div>
            <h2 className="display text-lg sm:text-xl font-black text-[#032038]">
              {t('unlockBirdSkinsTitle', 'Unlock Bird Skins')}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-[#032038]/70">
              {t('unlockBirdSkinsSub', 'Customization loved by users! Change the mascot color to your favorite shade.')}
            </p>
          </div>
        </div>

        {/* 4 Full-Width Skin Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch flex-1 min-h-0">
          {Object.values(BIRD_SKINS).map((skinItem) => {
            const isUnlocked = unlockedSkins.includes(skinItem.id);
            const isEquipped = equippedSkin === skinItem.id;

            const skinTitle =
              skinItem.id === 'classic'
                ? t('skinClassic', 'Classic RedBird')
                : skinItem.id === 'blue'
                ? t('skinBlue', 'Blue Bird')
                : skinItem.id === 'green'
                ? t('skinGreen', 'Green Bird')
                : t('skinGolden', 'Golden Bird');

            const skinPriceLabel = skinItem.price === 0 ? t('free', 'Free') : `${skinItem.price} 💎`;

            // Distinct themes per skin
            const skinCardStyle =
              skinItem.id === 'classic'
                ? {
                    background: 'linear-gradient(145deg, #ffffff 0%, #fff1f2 40%, #ffe4e6 100%)',
                    borderColor: isEquipped ? '#f43f5e' : '#fecdd3',
                  }
                : skinItem.id === 'blue'
                ? {
                    background: 'linear-gradient(145deg, #ffffff 0%, #eff6ff 40%, #dbeafe 100%)',
                    borderColor: isEquipped ? '#3b82f6' : '#bfdbfe',
                  }
                : skinItem.id === 'green'
                ? {
                    background: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 40%, #dcfce7 100%)',
                    borderColor: isEquipped ? '#22c55e' : '#bbf7d0',
                  }
                : {
                    background: 'linear-gradient(145deg, #ffffff 0%, #fffbeb 40%, #fef3c7 100%)',
                    borderColor: isEquipped ? '#f59e0b' : '#fde68a',
                  };

            return (
              <motion.div
                key={skinItem.id}
                className={`glass-card rounded-3xl p-4 sm:p-5 border-2 flex flex-col items-center justify-between space-y-3 transition-all relative overflow-hidden h-full ${
                  isEquipped
                    ? 'shadow-xl ring-4 ring-amber-400/30'
                    : isUnlocked
                    ? 'shadow-md hover:shadow-lg'
                    : 'shadow-sm hover:border-slate-400'
                }`}
                style={skinCardStyle}
                whileHover={{ y: -4 }}
              >
                {/* Equipped Badge Pill */}
                {isEquipped && (
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] tracking-wider uppercase shadow-xs flex items-center gap-1">
                    <Check size={11} strokeWidth={3} />
                    <span>{t('equipped', 'Equipped')}</span>
                  </div>
                )}

                {/* Skin Preview Bird */}
                <div className="py-2 flex items-center justify-center">
                  <RedBird
                    size={90}
                    skin={skinItem.id}
                    mood={isEquipped ? 'cheer' : 'wave'}
                    className="filter drop-shadow-md"
                  />
                </div>

                {/* Skin Details */}
                <div className="text-center space-y-1 w-full">
                  <h3 className="display text-base font-black text-[#032038]">{skinTitle}</h3>
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        skinItem.price === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {skinPriceLabel}
                    </span>
                    {isUnlocked && !isEquipped && (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {t('unlocked', 'Unlocked')}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA Action Button - Always attractive yellow shine btn-primary for actions */}
                {isEquipped ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-amber-400/25 text-black border-2 border-amber-400/60 cursor-default shadow-xs"
                  >
                    <Check size={16} strokeWidth={3} className="text-amber-800" />
                    <span>{t('inUse', 'In Use')}</span>
                  </button>
                ) : isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => handleSkinAction(skinItem.id, skinItem.price)}
                    disabled={loadingAction === skinItem.id}
                    className="btn-primary w-full py-2.5 px-4 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg cursor-pointer hover:scale-102 transition-all"
                  >
                    <span>{t('equipSkin', 'Equip')}</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSkinAction(skinItem.id, skinItem.price)}
                    disabled={loadingAction === skinItem.id}
                    className="btn-primary w-full py-2.5 px-4 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg cursor-pointer hover:scale-102 transition-all"
                  >
                    <Lock size={14} className="text-amber-950" />
                    <span>{t('unlockSkinBtn', 'Unlock ({{price}} 💎)', { price: skinItem.price })}</span>
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

