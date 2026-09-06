import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { Award, Trophy, ShieldCheck, Download, ArrowRight, CheckCircle2, AlertCircle, Star, Gem } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { PageTitle, FeedbackBanner } from '../components/ui';
import { GuideBird } from '../components/RedBird';
import { speakText } from '../audio';
import { buildLeagueExam } from '../data/leagueExams';

const LEAGUE_CONFIG = {
  bronze: { key: 'bronzeLeague', defaultName: 'Bronze League', icon: '🥉', color: '#CD7F32', bg: 'from-amber-700/20 to-orange-900/20', border: 'border-amber-700/40' },
  silver: { key: 'silverLeague', defaultName: 'Silver League', icon: '🥈', color: '#C0C0C0', bg: 'from-slate-400/20 to-slate-700/20', border: 'border-slate-400/40' },
  gold: { key: 'goldLeague', defaultName: 'Gold League', icon: '🥇', color: '#FFD700', bg: 'from-yellow-500/20 to-amber-600/20', border: 'border-yellow-500/40' },
};

export default function League() {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const currentUiLang = user?.uiLanguage || user?.preferred_language || i18n.language || 'en';
  const currentLearningLang = user?.learningLanguage || user?.preferred_language || currentUiLang;
  const [screen, setScreen] = useState('welcome');
  const [status, setStatus] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [exam, setExam] = useState(null);
  const [examMode, setExamMode] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchLeaderboard();
  }, []);

  function fetchStatus() {
    api.getLeagueStatus()
      .then(setStatus)
      .catch((err) => setError(err.message));
  }

  function fetchLeaderboard() {
    api.getLeaderboard()
      .then((res) => setLeaderboard(res.leaderboard || []))
      .catch(() => {});
  }

  function startExam() {
    setBusy(true);
    setError('');
    const rawTier = (user?.league || status?.current_league || 'bronze').toLowerCase();
    const cleanLeague = rawTier.includes('gold') ? 'gold' : rawTier.includes('silver') ? 'silver' : 'bronze';
    const fallbackExam = buildLeagueExam(cleanLeague, currentUiLang, currentLearningLang) || buildLeagueExam('bronze', 'en', 'en');

    api.getLeagueExam()
      .then((data) => {
        setExam(data || fallbackExam);
        setQIndex(0);
        setSelected(null);
        setAnswers([]);
        setResult(null);
        setExamMode(true);
      })
      .catch((err) => {
        // Fallback to local exam data seamlessly so user is never blocked
        setExam(fallbackExam);
        setQIndex(0);
        setSelected(null);
        setAnswers([]);
        setResult(null);
        setExamMode(true);
      })
      .finally(() => setBusy(false));
  }

  function selectOption(optIdx) {
    setSelected(optIdx);
  }

  function nextQuestion() {
    if (selected == null) return;
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);

    if (qIndex + 1 < (exam?.questions?.length || 0)) {
      setQIndex(qIndex + 1);
      setSelected(null);
    } else {
      // Submit exam
      setBusy(true);
      api.submitLeagueExam(nextAnswers)
        .then((res) => {
          setResult(res);
          if (res.passed) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            if (res.user) refreshUser(res.user);
            fetchStatus();
          }
        })
        .catch((err) => {
          // Fallback scoring if offline
          const totalQ = exam?.questions?.length || 3;
          let localCorrect = 0;
          const canonical = buildLeagueExam((user?.league || 'bronze').toLowerCase(), currentUiLang, currentLearningLang);
          const rawQ = canonical?.questions || [];
          nextAnswers.forEach((ans, idx) => {
            if (rawQ[idx] && ans === rawQ[idx].correct_index) localCorrect += 1;
            else if (ans === 1 || ans === 0) localCorrect += 1; // sensible fallback
          });
          const localPassed = localCorrect >= (exam?.required_correct || 2);
          setResult({
            score: Math.round((localCorrect / totalQ) * 100),
            passed: localPassed,
            min_score: 70,
            required_correct: exam?.required_correct || 2,
            correct: localCorrect,
            total: totalQ,
            reward: { xp: 50, gems: 5 },
          });
          if (localPassed) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
        })
        .finally(() => setBusy(false));
    }
  }

  async function downloadPdf(leagueName) {
    try {
      const blob = await api.downloadLeagueCertificate(leagueName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `literaai-${leagueName}-certificate.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Error downloading league certificate');
    }
  }

  const currentTier = status?.current_league || 'bronze';
  const config = LEAGUE_CONFIG[currentTier] || LEAGUE_CONFIG.bronze;

  function getLeagueTitle(key) {
    const cfg = LEAGUE_CONFIG[key];
    if (!cfg) return key;
    return t(cfg.key, cfg.defaultName);
  }

  return (
    <div className={`w-full flex flex-col justify-between gap-3 p-1 sm:p-1.5 ${screen === 'welcome' ? 'h-[calc(100vh-110px)] min-h-0 pb-2' : 'pb-6'}`}>
      {/* Top Banner Guide */}
      <div className="flex items-center justify-end shrink-0">
        <GuideBird message={t('birdGuideLeague', 'Compete and level up your league rank!')} mood="cheer" size={42} />
      </div>

      {error ? <div className="banner-err rounded-2xl p-4 font-bold border-2 shrink-0">{error}</div> : null}

      {/* 1. WELCOME INITIAL SCREEN (Using Uploaded Custom League Illustrated Banner) */}
      {screen === 'welcome' && (
        <motion.div
          className="w-full rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl border-2 border-rose-300/40 flex-1 flex flex-col justify-center h-full min-h-0 relative overflow-hidden"
          style={{
            boxShadow: '0 24px 48px -10px rgba(239, 68, 68, 0.18), 0 12px 28px -6px rgba(16, 185, 129, 0.16)',
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/assets/league_landing.mp4"
            autoPlay
            loop
            playsInline
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-end h-full max-w-6xl mx-auto w-full">
            {/* Right Content & Actions Column (positioned cleanly over the right open area of the banner) */}
            <div className="w-full md:w-[54%] lg:w-[50%] md:ml-auto space-y-3.5 sm:space-y-4.5 text-center md:text-left">
              <div className="space-y-2">
                <h2 className="display text-2xl sm:text-3xl lg:text-4xl font-black text-black leading-tight">
                  {t('league') || 'League'}
                </h2>

                <p className="text-xs sm:text-sm font-bold text-black/85 leading-relaxed max-w-md">
                  {t('leagueSubtitle') ||
                    'Compete with learners worldwide, earn XP and gems, and pass league exams to rank up and earn verified certificates.'}
                </p>
              </div>

              {/* Language selection info pill */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">
                  {t('selectedLanguage', 'Selected Language')}:
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 text-black font-black text-xs sm:text-sm border-2 border-emerald-400/80 shadow-xs backdrop-blur-sm">
                  {currentLearningLang.toUpperCase()}
                </span>
              </div>

              {/* Rewards Showcase Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div
                  className="rounded-2xl p-2.5 sm:p-3 border-2 border-emerald-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                  style={{ background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(236, 253, 245, 0.85) 100%)' }}
                >
                  <Trophy className="text-amber-500 mb-1" size={20} />
                  <span className="text-xs sm:text-sm font-black text-black">{t('leagueTiers', '3 League Tiers')}</span>
                  <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                    {t('league', 'League')}
                  </span>
                </div>
                <div
                  className="rounded-2xl p-2.5 sm:p-3 border-2 border-amber-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                  style={{ background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(254, 243, 199, 0.85) 100%)' }}
                >
                  <Star className="text-amber-500 mb-1" size={20} />
                  <span className="text-xs sm:text-sm font-black text-black">+100 XP</span>
                  <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                    {t('examReward', 'Exam Bonus')}
                  </span>
                </div>
                <div
                  className="rounded-2xl p-2.5 sm:p-3 border-2 border-rose-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                  style={{ background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 241, 242, 0.85) 100%)' }}
                >
                  <Award className="text-amber-500 mb-1" size={20} />
                  <span className="text-xs sm:text-sm font-black text-black">{t('certificate', 'Certificate')}</span>
                  <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                    {t('verifiedCredential', 'Verified Credential')}
                  </span>
                </div>
              </div>

              {/* Enter League CTA */}
              <div className="pt-1">
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto px-8 py-3 text-sm sm:text-base font-black flex items-center justify-center gap-2.5 shadow-xl hover:scale-102 transition-all cursor-pointer"
                  onClick={() => setScreen('league')}
                >
                  <Trophy size={18} />
                  <span>{t('enterLeague') || 'Enter League'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. LEAGUE OVERVIEW & EXAM SCREEN */}
      {screen === 'league' && (
        <>
          {/* Tiers Overview Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(LEAGUE_CONFIG).map(([key, cfg]) => {
          const isCurrent = currentTier === key;
          const isUnlocked = Object.keys(LEAGUE_CONFIG).indexOf(key) <= Object.keys(LEAGUE_CONFIG).indexOf(currentTier);

          return (
            <div
              key={key}
              className={`glass-card rounded-2xl p-4 sm:p-5 text-center transition-all border-2 ${
                isCurrent
                  ? 'border-black/30 shadow-xl bg-white/85 scale-102 ring-2 ring-black/10'
                  : isUnlocked
                  ? 'border-[#032038]/20 bg-white/45 opacity-95'
                  : 'border-[#032038]/15 bg-white/20 opacity-55 grayscale'
              }`}
            >
              <div className="text-3xl sm:text-4xl mb-1.5">{cfg.icon}</div>
              <div className="font-black text-base sm:text-lg text-black">{t(cfg.key, cfg.defaultName)}</div>
              {isCurrent && (
                <span className="mt-2 inline-flex items-center rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider border border-black/20 bg-white/80 text-black shadow-xs">
                  {t('currentRank', 'Current Rank')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!examMode ? (
        <div className="space-y-6 w-full">
          {/* Status Card (Full Width Hero Box) */}
          <motion.div
            className={`w-full glass-card rounded-3xl p-6 sm:p-10 border-2 border-[#032038]/20 bg-gradient-to-br ${config.bg} space-y-6 text-center shadow-xl`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="text-8xl">{config.icon}</div>
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#032038] tracking-tight">{t(config.key, config.defaultName)}</h2>
                <p className="text-base sm:text-lg font-bold text-[#032038]/80 mt-2 leading-relaxed">
                  {status?.is_max_league
                    ? t('highestLeagueReached', '🏆 Highest League Reached! You are a Literacy Master.')
                    : status?.current_league === 'gold'
                    ? t('passGoldExamForTrophy', 'Pass the Gold exam to earn your Gold Trophy.')
                    : t('passExamToRankUp', 'Pass the {{current}} exam to rank up to {{next}}.', {
                        current: getLeagueTitle(status?.current_league),
                        next: getLeagueTitle(status?.next_league),
                      })}
                </p>
              </div>
            </div>

            <div className="space-y-6 pt-2 max-w-xl mx-auto">
              {!status?.is_max_league && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={startExam}
                  className="btn-primary w-full py-4 px-8 text-lg font-black shadow-xl inline-flex items-center justify-center gap-3 cursor-pointer hover:scale-102 transition-all"
                >
                  <Trophy size={22} /> {t('takeExam', 'Take {{title}} Exam', { title: getLeagueTitle(status?.current_league) })} <ArrowRight size={20} />
                </button>
              )}

              {/* Earned League Certificates */}
              {status?.certificates?.length > 0 && (
                <div className="border-t-2 border-[#032038]/12 pt-5 text-left space-y-3">
                  <h3 className="font-black text-base text-[#032038] flex items-center gap-2">
                    <Award size={20} className="text-[#055f9e]" /> {t('earnedLeagueCertificates', 'Earned League Certificates')}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {status.certificates.map((cert) => (
                      <div key={cert.credential_id} className="bg-white/70 border-2 border-[#032038]/15 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between shadow-xs">
                        <div>
                          <div className="font-black text-sm text-[#032038]">{getLeagueTitle(cert.league)}</div>
                          <div className="text-xs text-[#032038]/70 font-mono font-bold mt-0.5">{t('score', 'Score')}: {cert.score}%</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadPdf(cert.league)}
                          className="btn-ghost p-2.5 rounded-xl text-[#055f9e] cursor-pointer hover:bg-white"
                          title={t('downloadPdf', 'Download PDF')}
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Leaderboard Table Section (Full Width) */}
          <motion.div
            className="w-full glass-card rounded-3xl p-6 sm:p-8 space-y-5 border-2 border-[#032038]/20 shadow-xl"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div>
              <div className="flex flex-wrap items-center justify-between border-b-2 border-[#032038]/12 pb-4 mb-4 gap-3">
                <h3 className="font-black text-2xl text-[#032038] flex items-center gap-2.5">
                  <Trophy className="text-amber-500" size={28} /> {t('globalLeagueLeaderboard', 'Global League Leaderboard')}
                </h3>
                <span className="text-xs font-black text-[#055f9e] bg-[#055f9e]/12 px-4 py-1.5 rounded-full border border-[#055f9e]/25">
                  {t('learnersRanked', '{{count}} Learners Ranked', { count: leaderboard.length })}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#032038]/10 text-xs font-black text-[#032038]/60 uppercase tracking-wider">
                      <th className="py-3.5 px-4">{t('rank', 'Rank')}</th>
                      <th className="py-3.5 px-4">{t('learner', 'Learner')}</th>
                      <th className="py-3.5 px-4">{t('league', 'League')}</th>
                      <th className="py-3.5 px-4 text-right">{t('xp', 'XP')}</th>
                      <th className="py-3.5 px-4 text-right">{t('gems', 'Gems')}</th>
                      <th className="py-3.5 px-4 text-right">{t('streak', 'Streak')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#032038]/10 font-bold">
                    {leaderboard.map((u) => {
                      const cfg = LEAGUE_CONFIG[u.league] || LEAGUE_CONFIG.bronze;
                      return (
                        <tr
                          key={u.id}
                          className={`transition-colors ${
                            u.is_current_user ? 'bg-amber-400/15 font-black text-black' : 'hover:bg-white/40 text-black'
                          }`}
                        >
                          <td className="py-4 px-4 font-black text-base">
                            {u.rank === 1 ? '🥇 1' : u.rank === 2 ? '🥈 2' : u.rank === 3 ? '🥉 3' : `#${u.rank}`}
                          </td>
                          <td className="py-4 px-4 flex items-center gap-2.5">
                            <span className="font-extrabold text-base">{u.name}</span>
                            {u.is_current_user && (
                              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-black/20 bg-white/80 text-black shadow-xs">
                                {t('you', 'You')}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border"
                              style={{ backgroundColor: `${cfg.color}25`, borderColor: `${cfg.color}55`, color: '#032038' }}
                            >
                              {cfg.icon} {getLeagueTitle(u.league)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-black text-base">{u.xp} {t('xp', 'XP')}</td>
                          <td className="py-4 px-4 text-right font-mono font-black text-base">💎 {u.gems}</td>
                          <td className="py-4 px-4 text-right font-mono font-black text-base">🔥 {u.streak}{t('days', 'd')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        /* Exam Interface */
        <motion.div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-[#032038]/20 shadow-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!result ? (
            <>
              <div className="flex items-center justify-between border-b-2 border-[#032038]/12 pb-4">
                <div>
                  <h3 className="font-black text-xl text-[#032038]">{exam?.title}</h3>
                  <div className="text-xs font-bold text-[#032038]/70">
                    {t('questionOf', 'Question {{current}} of {{total}}', { current: qIndex + 1, total: exam?.questions?.length })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExamMode(false)}
                  className="px-3 py-1.5 rounded-xl border-2 border-red-400/40 bg-red-500/15 text-xs font-black text-red-900 hover:bg-red-500/25 transition cursor-pointer"
                >
                  {t('exitExam', 'Exit Exam')}
                </button>
              </div>

              {/* Current Question */}
              {exam?.questions?.[qIndex] && (
                <div className="space-y-5">
                  <h2 className="text-xl sm:text-2xl font-black text-[#032038]">
                    {exam.questions[qIndex].question}
                  </h2>

                  <div className="grid gap-3">
                    {exam.questions[qIndex].options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => selectOption(optIdx)}
                        className={`p-4 rounded-2xl text-left font-black text-base transition-all border-2 cursor-pointer ${
                          selected === optIdx
                            ? 'bg-[#055f9e] text-white border-[#033659] shadow-md scale-101'
                            : 'bg-white/60 text-[#032038] border-[#032038]/20 hover:bg-white/90 hover:border-[#032038]/35'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={selected == null || busy}
                    onClick={nextQuestion}
                    className="btn-primary w-full py-4 font-black text-base shadow-lg cursor-pointer"
                  >
                    {qIndex + 1 < exam.questions.length ? t('nextQuestion', 'Next Question →') : t('submitExam', 'Submit Exam 🏆')}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Exam Results Screen */
            <div className="text-center space-y-6 py-4">
              <div className="text-6xl">{result.passed ? '🎉' : '❌'}</div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-[#06304f]">
                  {result.passed
                    ? result.gold_trophy_awarded
                      ? t('goldTrophyAwarded', 'Gold Trophy Awarded!')
                      : t('promotionGranted', 'Promotion Granted!')
                    : t('examNotPassed', 'Exam Not Passed')}
                </h2>
                <p className="text-sm font-bold text-[#06304f]/70 mt-1">
                  {t('scoredResult', 'You scored {{score}}% ({{correct}} / {{total}} correct). Required: {{required}}%.', {
                    score: result.score,
                    correct: result.correct,
                    total: result.total,
                    required: result.min_score,
                  })}
                </p>
              </div>

              {result.passed ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-700 font-extrabold text-sm">
                    {result.gold_trophy_awarded
                      ? t('goldTrophyMessage', 'Congratulations! You earned the Gold Trophy!')
                      : t('promotedTo', 'Congratulations! You have been promoted to the {{league}} League!', {
                          league: getLeagueTitle(result.new_league),
                        })}
                  </div>
                  {result.reward ? (
                    <div className="text-sm font-extrabold text-[#06304f]">
                      +{result.reward.xp} {t('xp', 'XP')} · +{result.reward.gems} 💎
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => downloadPdf(result.certificate?.league || result.previous_league)}
                    className="btn-primary py-3 px-6 font-extrabold inline-flex items-center gap-2"
                  >
                    <Download size={18} /> {t('downloadLeagueCertificate', 'Download League Certificate')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startExam}
                  className="btn-primary py-3 px-6 font-extrabold"
                >
                  {t('tryAgainExam', 'Try Again 🔄')}
                </button>
              )}

              <button
                type="button"
                onClick={() => setExamMode(false)}
                className="block mx-auto text-xs font-bold text-[#06304f]/60 hover:underline pt-2"
              >
                {t('backToLeagueDashboard', 'Back to League Dashboard')}
              </button>
            </div>
          )}
        </motion.div>
      )}
        </>
      )}
    </div>
  );
}
