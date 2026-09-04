import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Award,
  Download,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Eye,
  BookOpen,
  Lock,
  ArrowRight,
  Trophy,
  ArrowLeft,
  GraduationCap
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/client";
import { PageTitle } from "../components/ui";
import { GuideBird } from "../components/RedBird";
import { speakText } from "../audio";
import { CERT_LABELS } from "../data/certificateLabels";

function LockedChainsOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-[14px]">
      <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[1.5px]" />

      <motion.div
        className="relative z-30 flex flex-col items-center justify-center"
        initial={{ scale: 0.95 }}
        animate={{ scale: [1, 1.06, 1], y: [0, -4, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute -inset-6 rounded-full bg-amber-400/40 blur-xl animate-pulse" />

        <svg width="80" height="88" viewBox="0 0 68 74" fill="none" className="drop-shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
          <defs>
            <linearGradient id="shackleGradCert" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="35%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="bodyGradCert" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="30%" stopColor="#ffd700" />
              <stop offset="75%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <path d="M20 32 V 19 C 20 11.268 26.268 5 34 5 C 41.732 5 48 11.268 48 19 V 32" stroke="url(#shackleGradCert)" strokeWidth="8" strokeLinecap="round" />
          <rect x="8" y="28" width="52" height="42" rx="12" fill="url(#bodyGradCert)" stroke="#78350f" strokeWidth="2.5" />
          <rect x="12" y="32" width="44" height="18" rx="8" fill="white" fillOpacity="0.28" />
          <circle cx="34" cy="46" r="4.5" fill="#451a03" />
          <polygon points="32,47 36,47 35.2,56 32.8,56" fill="#451a03" />
          <circle cx="20" cy="38" r="2.5" fill="white" fillOpacity="0.85" />
        </svg>
      </motion.div>
    </div>
  );
}

export default function Certificate() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const certRef = useRef(null);

  const lang = (user?.uiLanguage || i18n.language) && CERT_LABELS[user?.uiLanguage || i18n.language]
    ? (user?.uiLanguage || i18n.language)
    : "en";
  const labels = CERT_LABELS[lang] || CERT_LABELS.en;

  // Screen state: 'welcome' | 'directory'
  const [screen, setScreen] = useState("welcome");

  // Parse user earned course certificates from user context and local storage fallback
  const localCerts = (() => {
    try {
      const raw = localStorage.getItem(`literaai_certs_${user?.id || 'guest'}`);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  })();

  const rawUserCerts = Array.isArray(user?.certificates) && user.certificates.length > 0
    ? user.certificates.filter((c) => c.issued)
    : user?.certificate?.issued
    ? [user.certificate]
    : [];

  const userCourseCerts = [...rawUserCerts, ...localCerts];

  // Parse user earned league certificates
  const userLeagueCerts = Array.isArray(user?.league_certificates)
    ? user.league_certificates.map((lc) => ({
        ...lc,
        course_title: lc.league_title || `${lc.league?.toUpperCase() || ""} League Tier Certificate`,
        course_id: `league-${lc.league}`,
        is_league: true,
        issued: true,
      }))
    : [];

  // Master Certificate Definitions
  const CERTIFICATE_CATALOG = [
    {
      id: "course-0",
      type: "course",
      courseId: 0,
      stage: 1,
      title: labels.course1Title,
      desc: labels.course1Desc,
      tier: "Foundation",
      icon: BookOpen,
      colorClass: "stat-gold",
      accentBorder: "border-amber-500/25",
      accentBg: "bg-amber-500/10",
      accentText: "text-amber-800",
      link: "/course/0",
      linkText: `${labels.startCourse} 1`,
    },
    {
      id: "course-1",
      type: "course",
      courseId: 1,
      stage: 2,
      title: labels.course2Title,
      desc: labels.course2Desc,
      tier: "Beginner",
      icon: BookOpen,
      colorClass: "stat-gold",
      accentBorder: "border-amber-500/25",
      accentBg: "bg-amber-500/10",
      accentText: "text-amber-800",
      link: "/course/1",
      linkText: `${labels.startCourse} 2`,
    },
    {
      id: "course-2",
      type: "course",
      courseId: 2,
      stage: 3,
      title: labels.course3Title,
      desc: labels.course3Desc,
      tier: "Intermediate",
      icon: BookOpen,
      colorClass: "stat-gold",
      accentBorder: "border-amber-500/25",
      accentBg: "bg-amber-500/10",
      accentText: "text-amber-800",
      link: "/course/2",
      linkText: `${labels.startCourse} 3`,
    },
    {
      id: "course-3",
      type: "course",
      courseId: 3,
      stage: 4,
      title: labels.course4Title,
      desc: labels.course4Desc,
      tier: "Advanced",
      icon: BookOpen,
      colorClass: "stat-gold",
      accentBorder: "border-amber-500/25",
      accentBg: "bg-amber-500/10",
      accentText: "text-amber-800",
      link: "/course/3",
      linkText: `${labels.startCourse} 4`,
    },
    {
      id: "league-gold",
      type: "league",
      league: "gold",
      title: labels.goldLeagueTitle,
      desc: labels.goldLeagueDesc,
      tier: "Gold League",
      icon: Trophy,
      colorClass: "stat-gold",
      accentBorder: "border-amber-500/25",
      accentBg: "bg-amber-500/10",
      accentText: "text-amber-800",
      link: "/league",
      linkText: labels.goToLeague,
    },
    {
      id: "league-silver",
      type: "league",
      league: "silver",
      title: labels.silverLeagueTitle,
      desc: labels.silverLeagueDesc,
      tier: "Silver League",
      icon: Trophy,
      colorClass: "stat-gold",
      accentBorder: "border-amber-500/25",
      accentBg: "bg-amber-500/10",
      accentText: "text-amber-800",
      link: "/league",
      linkText: labels.goToLeague,
    },
    {
      id: "league-bronze",
      type: "league",
      league: "bronze",
      title: labels.bronzeLeagueTitle,
      desc: labels.bronzeLeagueDesc,
      tier: "Bronze League",
      icon: Trophy,
      colorClass: "stat-gold",
      accentBorder: "border-amber-500/25",
      accentBg: "bg-amber-500/10",
      accentText: "text-amber-800",
      link: "/league",
      linkText: labels.goToLeague,
    },
  ];

  // Merge catalog with user earned status
  const certificatesList = CERTIFICATE_CATALOG.map((item) => {
    let earnedMatch = null;
    if (item.type === "course") {
      earnedMatch = userCourseCerts.find(
        (c) =>
          String(c.course_id) === String(item.courseId) ||
          String(c.courseId) === String(item.courseId) ||
          Number(c.stage) === Number(item.stage) ||
          Number(c.courseId) === Number(item.courseId) ||
          c.course_title?.toLowerCase().includes(`course ${item.stage}`) ||
          c.course_title?.toLowerCase().includes(`stage ${item.stage}`) ||
          (item.stage === 1 && (String(c.course_id).includes('foundation') || c.course_title?.toLowerCase().includes('reading everyday words'))) ||
          (item.stage === 2 && (String(c.course_id).includes('beginner') || c.course_title?.toLowerCase().includes('understanding everyday sentences'))) ||
          (item.stage === 3 && (String(c.course_id).includes('intermediate') || c.course_title?.toLowerCase().includes('using information in daily life'))) ||
          (item.stage === 4 && (String(c.course_id).includes('advanced') || c.course_title?.toLowerCase().includes('reading for understanding')))
      );

      // Auto-unlock if user has course completion in course_progress
      if (!earnedMatch) {
        const prog = user?.course_progress;
        const done = prog?.lessons_completed || [];
        const isProgMatch =
          (item.stage === 1 && (prog?.course_id === '0' || prog?.course_id === 0 || String(prog?.course_id || '').includes('foundation') || done.length > 0)) ||
          (item.stage === 2 && (prog?.course_id === '1' || prog?.course_id === 1 || String(prog?.course_id || '').includes('beginner'))) ||
          (item.stage === 3 && (prog?.course_id === '2' || prog?.course_id === 2 || String(prog?.course_id || '').includes('intermediate'))) ||
          (item.stage === 4 && (prog?.course_id === '3' || prog?.course_id === 3 || String(prog?.course_id || '').includes('advanced')));

        if (isProgMatch && done.length > 0) {
          earnedMatch = {
            issued: true,
            status: 'unlocked',
            credential_id: `LIT-COURSE${item.stage}-${user?.id?.slice(0, 6)?.toUpperCase() || 'PASS'}`,
            course_id: String(item.courseId),
            course_title: item.title,
            score: prog?.lesson_scores?.[0] || 100,
            issued_date: new Date().toISOString(),
            ui_language: user?.uiLanguage || 'en',
            learning_language: user?.learningLanguage || 'en',
          };
        }
      }
    } else if (item.type === "league") {
      earnedMatch = userLeagueCerts.find(
        (c) => c.league?.toLowerCase() === item.league?.toLowerCase()
      );
    }

    const isUnlocked = !!earnedMatch;
    return {
      ...item,
      isUnlocked,
      earnedData: earnedMatch || null,
      course_title: earnedMatch?.course_title || item.title,
      score: earnedMatch?.score || 100,
      credential_id: earnedMatch?.credential_id || `LIT-${item.id.toUpperCase()}-LOCKED`,
      issued_date: earnedMatch?.issued_date || new Date().toLocaleDateString(),
      learning_language: earnedMatch?.learning_language || user?.learningLanguage || "en",
    };
  });

  const [activeCert, setActiveCert] = useState(
    certificatesList.find((c) => c.isUnlocked) || certificatesList[0]
  );
  const [filterType, setFilterType] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const firstUnlocked = certificatesList.find((c) => c.isUnlocked);
    if (firstUnlocked && (!activeCert || !activeCert.isUnlocked)) {
      setActiveCert(firstUnlocked);
    }
  }, [certificatesList]);

  useEffect(() => {
    if (screen === "directory" && activeCert?.isUnlocked) {
      speakText(labels.victorySpeech, lang).catch(() => {});
    }
  }, [screen, activeCert?.id, activeCert?.isUnlocked, lang]);

  const filteredCerts = certificatesList.filter((c) => {
    if (filterType === "course") return c.type === "course";
    if (filterType === "league") return c.type === "league";
    if (filterType === "unlocked") return c.isUnlocked;
    if (filterType === "locked") return !c.isUnlocked;
    return true;
  });

  async function download(certToDownload) {
    const cert = certToDownload || activeCert;
    if (!cert || !cert.isUnlocked) return;
    setBusy(true);
    setError("");
    try {
      if (cert?.is_league || cert?.league) {
        const blob = await api.downloadLeagueCertificate(cert.league || "bronze");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `literaai-${cert.league || "league"}-certificate.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const element = certRef.current;
      if (!element) return;

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Certificate - ${cert?.course_title || "LiteraAI"}</title>
            <style>
              @page { size: A4 landscape; margin: 0; }
              html, body { width: 100vw; height: 100vh; margin: 0; padding: 0; overflow: hidden; background: #ffffff; display: flex; justify-content: center; align-items: center; }
              .cert-print-container { width: 100vw; height: 100vh; padding: 12mm; display: flex; align-items: center; justify-content: center; }
              .cert-print-container > * { width: 100% !important; height: 100% !important; max-width: none !important; aspect-ratio: auto !important; transform: none !important; box-shadow: none !important; }
              * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            </style>
            ${Array.from(document.querySelectorAll("style, link[rel=\"stylesheet\"]")).map((s) => s.outerHTML).join("\n")}
          </head>
          <body>
            <div class="cert-print-container">
              ${element.outerHTML}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    } catch (err) {
      setError(err.message || "Error downloading certificate");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!activeCert || !activeCert.isUnlocked) return;
    const text = `🎉 LiteraAI Certificate: ${activeCert?.course_title}! Credential: ${activeCert?.credential_id}`;
    if (navigator.share) {
      await navigator.share({ title: labels.title, text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
  }

  const unlockedCount = certificatesList.filter((c) => c.isUnlocked).length;

  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-2 p-1 sm:p-1.5 pb-2 h-[calc(100vh-110px)] min-h-0">
      {/* ── 1. INITIAL LANDING / WELCOME SCREEN (Exact Same Height & Proportion as Voice Practice) */}
      {screen === "welcome" && (
        <>
          {/* Top Banner Guide */}
          <div className="flex items-center justify-end shrink-0">
            <GuideBird
              message={labels.landingSubtitle}
              mood="cheer"
              size={42}
            />
          </div>

          <motion.div
            className="w-full rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl border-2 border-indigo-300/40 flex-1 flex flex-col justify-center h-full min-h-0 relative overflow-hidden"
            style={{
              boxShadow:
                "0 24px 48px -10px rgba(99, 102, 241, 0.18), 0 12px 28px -6px rgba(16, 185, 129, 0.16)",
            }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
            <video
              className="absolute inset-0 z-0 h-full w-full object-cover"
              src="/assets/certificate_landing.mp4?v=1"
              autoPlay
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-end h-full max-w-6xl mx-auto w-full">
              {/* Right Column: Hero Content & Action */}
              <div className="w-full md:w-[54%] lg:w-[50%] md:ml-auto space-y-3.5 sm:space-y-4.5 text-center md:text-left">
                <div className="space-y-2">
                  <h2 className="display text-2xl sm:text-3xl lg:text-4xl font-black text-black leading-tight">
                    {labels.landingTitle}
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-black/85 leading-relaxed max-w-md">
                    {labels.landingSubtitle}
                  </p>
                </div>

                {/* Language selection info pill */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">
                    {labels.selectedLang}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 text-black font-black text-xs sm:text-sm border-2 border-indigo-400/80 shadow-xs backdrop-blur-sm">
                    {lang.toUpperCase()}
                  </span>
                </div>

                {/* Rewards / Feature Showcase Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div
                    className="rounded-2xl p-2.5 sm:p-3 border-2 border-amber-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(254, 243, 199, 0.85) 100%)",
                    }}
                  >
                    <BookOpen className="text-amber-600 mb-1" size={20} />
                    <span className="text-xs sm:text-sm font-black text-black">
                      {labels.landingCoursesChip}
                    </span>
                    <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                      {labels.landingCoursesSub}
                    </span>
                  </div>

                  <div
                    className="rounded-2xl p-2.5 sm:p-3 border-2 border-emerald-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(236, 253, 245, 0.85) 100%)",
                    }}
                  >
                    <Trophy className="text-amber-600 mb-1" size={20} />
                    <span className="text-xs sm:text-sm font-black text-black">
                      {labels.landingLeagueChip}
                    </span>
                    <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                      {labels.landingLeagueSub}
                    </span>
                  </div>

                  <div
                    className="rounded-2xl p-2.5 sm:p-3 border-2 border-indigo-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 242, 255, 0.85) 100%)",
                    }}
                  >
                    <Award className="text-amber-600 mb-1" size={20} />
                    <span className="text-xs sm:text-sm font-black text-black">
                      {labels.landingCertChip}
                    </span>
                    <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                      {labels.landingCertSub}
                    </span>
                  </div>
                </div>

                {/* Start / Explore CTA Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    className="btn-primary w-full sm:w-auto px-8 py-3 text-sm sm:text-base font-black flex items-center justify-center gap-2.5 shadow-xl hover:scale-102 transition-all cursor-pointer text-black"
                    onClick={() => setScreen("directory")}
                  >
                    <Award size={18} />
                    <span>{labels.exploreCertsBtn}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* ── 2. INTERACTIVE DIRECTORY & CERTIFICATE PREVIEW SCREEN ── */}
      {screen === "directory" && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Top Header with Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScreen("welcome")}
                className="btn-ghost py-2 px-3 text-xs font-black flex items-center gap-1.5 text-black border border-slate-300 rounded-xl hover:bg-white transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>{labels.backToOverview}</span>
              </button>
              <PageTitle title={labels.title} subtitle={labels.subtitle || labels.lockedMsg} />
            </div>

            <GuideBird
              message={activeCert?.isUnlocked ? labels.victorySpeech : labels.lockedMsg}
              mood={activeCert?.isUnlocked ? "cheer" : "think"}
              size={46}
            />
          </div>

          {error ? <div className="mb-2 font-bold text-[#7a1f1f] text-center">{error}</div> : null}

          {/* Active Certificate Parchment Display */}
          {activeCert && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#06304f]/75 flex items-center gap-1.5">
                  <Award size={16} className="text-[#0b6fb8]" />
                  <span>
                    {activeCert.isUnlocked ? labels.viewing : labels.locked}: {activeCert.course_title}
                  </span>
                </h3>

                {activeCert.isUnlocked ? (
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 shadow-xs inline-flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-700" />
                    {activeCert?.type === "league" ? "🏆 League Tier Certificate" : "🎓 Literacy Certificate"}
                  </span>
                ) : (
                  <span className="text-xs font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 shadow-xs inline-flex items-center gap-1">
                    <Lock size={12} className="text-amber-700" />
                    {labels.locked}
                  </span>
                )}
              </div>

              <motion.div
                ref={certRef}
                key={activeCert.id}
                className="relative mx-auto w-full max-w-4xl aspect-[16/9]"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0b6fb8] via-[#38bdf8] to-[#0b6fb8] p-[3px] shadow-2xl">
                  <div className="h-full w-full rounded-[14px] bg-[#f0f8ff] p-[6px]">
                    <div
                      className="h-full w-full rounded-[10px] border-[2.5px] border-[#0b6fb8]/40 bg-[#f7fbff] flex flex-col relative overflow-hidden"
                      style={{ borderStyle: "double", borderWidth: "4px" }}
                    >
                      {!activeCert.isUnlocked && <LockedChainsOverlay />}

                      {[
                        "top-2 left-2",
                        "top-2 right-2 -scale-x-100",
                        "bottom-2 left-2 -scale-y-100",
                        "bottom-2 right-2 -scale-x-100 -scale-y-100",
                      ].map((pos, i) => (
                        <svg
                          key={i}
                          className={`absolute ${pos} pointer-events-none`}
                          width="44"
                          height="44"
                          viewBox="0 0 48 48"
                          fill="none"
                        >
                          <path
                            d="M4 4C4 4 4 20 12 28C20 36 36 44 44 44"
                            stroke="#0b6fb8"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            opacity="0.35"
                          />
                          <circle cx="6" cy="6" r="2.5" fill="#0b6fb8" opacity="0.25" />
                        </svg>
                      ))}

                      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-4 md:px-12 md:py-6">
                        <div className="tracking-[0.3em] text-[10px] md:text-xs font-bold text-[#0b6fb8]/70 uppercase">
                          {labels.academy}
                        </div>

                        <div className="flex items-center gap-3 mt-1">
                          <div className="h-[1px] w-8 md:w-16 bg-gradient-to-r from-transparent to-[#0b6fb8]/40" />
                          <h2
                            className="text-xl md:text-3xl font-black text-[#06304f] tracking-wider"
                            style={{ fontFamily: "'Space Grotesk', serif" }}
                          >
                            {labels.title}
                          </h2>
                          <div className="h-[1px] w-8 md:w-16 bg-gradient-to-l from-transparent to-[#0b6fb8]/40" />
                        </div>

                        <p className="mt-2 text-[11px] md:text-sm text-[#06304f]/70 italic">
                          {labels.presentedTo}
                        </p>

                        <h1
                          className="mt-0.5 text-2xl md:text-4xl font-black text-[#0b6fb8]"
                          style={{ fontFamily: "'Space Grotesk', serif" }}
                        >
                          {user?.name || "Learner"}
                        </h1>

                        <div className="mt-1 h-[1px] w-40 md:w-64 bg-[#0b6fb8]/30" />

                        <p className="mt-2 text-[10px] md:text-xs text-[#06304f]/70">
                          {activeCert.type === "league"
                            ? "for demonstrating excellence and ranking up in the"
                            : labels.completedText}
                        </p>
                        <p className="mt-0.5 text-base md:text-xl font-extrabold text-[#06304f]">
                          {activeCert.course_title}
                        </p>

                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#0b6fb8]/25 bg-[#0b6fb8]/5 px-3 py-0.5 text-xs font-bold text-[#0b6fb8]">
                          {activeCert.isUnlocked ? <CheckCircle2 size={13} /> : <Lock size={12} />}
                          <span>
                            {labels.score}: {activeCert.isUnlocked ? `${activeCert.score}%` : "80% (Required)"}
                          </span>
                        </div>

                        <div className="mt-auto pt-2 w-full grid grid-cols-3 items-end gap-2 px-2 md:px-6">
                          <div className="text-left space-y-0.5">
                            <div className="flex items-center gap-1 text-[9px] md:text-[11px] font-bold text-[#0b6fb8]">
                              <ShieldCheck size={12} /> {labels.seal}
                            </div>
                            <div className="text-[8px] md:text-[10px] text-[#06304f]/60 font-mono">
                              {labels.credentialId}: {activeCert.credential_id}
                            </div>
                            <div className="text-[8px] md:text-[10px] text-[#06304f]/60">
                              {labels.issuedDate}: {activeCert.issued_date ? new Date(activeCert.issued_date).toLocaleDateString() : labels.locked}
                            </div>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="relative flex h-12 w-12 md:h-16 md:w-16 items-center justify-center">
                              <div className="absolute inset-0 rounded-full border-[2.5px] border-[#0b6fb8]/30" />
                              <div className="relative flex h-8 w-8 md:h-11 md:w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#0b6fb8] to-[#065a96] shadow-md">
                                {activeCert.isUnlocked ? (
                                  <Award className="text-white" size={18} />
                                ) : (
                                  <Lock className="text-white" size={16} />
                                )}
                              </div>
                            </div>
                            <span className="mt-0.5 text-[7px] md:text-[9px] font-bold tracking-widest text-[#0b6fb8]/50 uppercase">
                              {activeCert.isUnlocked ? "Official Seal" : "Locked Seal"}
                            </span>
                          </div>

                          <div className="text-right flex flex-col items-end">
                            <div className="w-20 md:w-28 border-b border-[#06304f]/30 mb-0.5" />
                            <div className="text-xs md:text-sm font-bold italic text-[#0b6fb8]">
                              LiteraAI Board
                            </div>
                            <div className="text-[7px] md:text-[9px] tracking-wider text-[#06304f]/50 uppercase">
                              Authorized Signatory
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons Below Active Certificate */}
              {activeCert.isUnlocked && (
                <div className="flex flex-wrap justify-center gap-3 pt-1">
                  <button
                    className="btn-primary inline-flex items-center gap-2 shadow-xl py-2.5 px-7 text-sm font-black cursor-pointer text-black"
                    type="button"
                    disabled={busy}
                    onClick={() => download(activeCert)}
                  >
                    <Download size={16} /> {labels.download}
                  </button>
                  <button
                    className="btn-ghost inline-flex items-center gap-2 py-2.5 px-5 text-sm font-black border border-slate-300 cursor-pointer text-black"
                    type="button"
                    onClick={share}
                  >
                    <Share2 size={16} /> {labels.share}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── All Certificates Catalog Grid (4 Courses + 3 League Tiers) ── */}
          <div
            className="rounded-3xl p-4 md:p-6 space-y-4 border-2 shadow-lg backdrop-blur-md relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(254, 226, 226, 0.88) 0%, rgba(255, 241, 242, 0.95) 50%, rgba(254, 205, 211, 0.88) 100%)",
              borderColor: "rgba(225, 29, 72, 0.35)",
              boxShadow: "0 14px 36px rgba(225, 29, 72, 0.14), 0 2px 8px rgba(225, 29, 72, 0.08)",
            }}
          >
            {/* Header & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-900/10 pb-3">
              <div>
                <h2 className="text-lg md:text-xl font-black text-[#06304f] flex items-center gap-2">
                  <Award className="text-rose-600" size={22} /> {labels.allCertificates}
                </h2>
                <p className="text-xs font-bold text-[#06304f]/60 mt-0.5">
                  {labels.totalEarned}: {unlockedCount} / {certificatesList.length}
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: `${labels.all} (${certificatesList.length})` },
                  { id: "course", label: `${labels.courseFilter} (4)` },
                  { id: "league", label: `${labels.leagueFilter} (3)` },
                  { id: "unlocked", label: `${labels.unlocked} (${unlockedCount})` },
                  { id: "locked", label: `${labels.locked} (${certificatesList.length - unlockedCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer border ${
                      filterType === tab.id
                        ? "btn-primary text-black shadow-md border-amber-500/80"
                        : "bg-white/70 text-[#032038]/80 border-slate-200 hover:bg-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Certificate Cards Responsive Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {filteredCerts.map((cert) => {
                const IconComp = cert.icon;
                const isViewing = activeCert?.id === cert.id;

                return (
                  <motion.div
                    key={cert.id}
                    whileHover={{ y: -2 }}
                    onClick={() => {
                      setActiveCert(cert.earnedData || cert);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`glass-card rounded-2xl p-4 border-2 transition flex flex-col justify-between space-y-3 relative overflow-hidden cursor-pointer ${
                      cert.isUnlocked
                        ? "border-emerald-500/30 bg-gradient-to-b from-emerald-50/80 via-white to-emerald-50/40 shadow-md"
                        : "border-[#032038]/18 bg-white/85 hover:bg-white shadow-xs"
                    } ${isViewing ? "ring-2 ring-[#0b6fb8] shadow-lg" : ""}`}
                  >
                    {/* Top Row: Icon + Tier Kicker + Status Badge */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            cert.isUnlocked
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : `${cert.accentBg} ${cert.accentText} ${cert.accentBorder}`
                          }`}
                        >
                          <IconComp size={20} />
                        </div>

                        {cert.isUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
                            <CheckCircle2 size={12} className="text-emerald-700" />
                            {labels.unlocked}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
                            <Lock size={11} className="text-slate-500" />
                            {labels.locked}
                          </span>
                        )}
                      </div>

                      {/* Certificate Title & Stage */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#032038]/60 block">
                          {cert.tier}
                        </span>
                        <h3 className="font-black text-sm text-[#032038] line-clamp-2 leading-snug mt-0.5">
                          {cert.title}
                        </h3>
                      </div>

                      {/* Description / Requirement */}
                      <p className="text-xs font-semibold text-[#032038]/70 leading-relaxed line-clamp-2">
                        {cert.desc}
                      </p>

                      {/* Stats (if unlocked) */}
                      {cert.isUnlocked ? (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-xs font-bold">
                          <div>
                            <span className="text-[#032038]/50 block text-[9px] uppercase tracking-wider">
                              {labels.score}
                            </span>
                            <span className="text-emerald-700 font-black">{cert.score}%</span>
                          </div>
                          <div>
                            <span className="text-[#032038]/50 block text-[9px] uppercase tracking-wider">
                              {labels.issuedDate}
                            </span>
                            <span className="text-[#032038] font-bold text-[11px]">
                              {cert.issued_date
                                ? new Date(cert.issued_date).toLocaleDateString()
                                : new Date().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Card Action Buttons */}
                    <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                      {cert.isUnlocked ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCert(cert.earnedData || cert);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={`btn-primary flex-1 py-2 px-3 text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:scale-101 transition cursor-pointer text-black ${
                              isViewing ? "ring-2 ring-amber-600 shadow-lg scale-101" : ""
                            }`}
                          >
                            <Eye size={13} />
                            <span>{isViewing ? labels.viewing : labels.viewCert}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => download(cert.earnedData || cert)}
                            className="py-2 px-2.5 rounded-xl font-black text-xs bg-amber-500/10 text-amber-900 border border-amber-400/50 hover:bg-amber-500 hover:text-white transition cursor-pointer"
                            title={labels.download}
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCert(cert.earnedData || cert);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`btn-primary w-full py-2.5 px-3 text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:scale-101 transition cursor-pointer text-black ${
                            isViewing ? "ring-2 ring-amber-600 shadow-lg scale-101" : ""
                          }`}
                        >
                          <Lock size={12} className="text-black/80" />
                          <span>{isViewing ? labels.viewing : labels.viewCert}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
