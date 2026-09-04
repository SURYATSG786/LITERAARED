import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { PageTitle, ProgressBar } from '../components/ui';
import { GuideBird } from '../components/RedBird';
import { QuestionImage } from '../components/QuestionImage';
import { SpeakButton } from '../components/SpeakButton';
import { speakText } from '../audio';

export default function Assessment() {
  const { t, i18n } = useTranslation();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!started) return;
    api
      .getAssessment()
      .then((res) => {
        const usable = (res.questions || []).filter(
          (item) =>
            item
            && item.id
            && String(item.question || '').trim()
            && Array.isArray(item.options)
            && item.options.length === 4
            && item.options.every((opt) => String(opt || '').trim())
        );
        if (!usable.length) {
          setError(t('assessmentBroken'));
          setQuestions([]);
          return;
        }
        setQuestions(usable);
      })
      .catch((err) => setError(err.message));
  }, [started, t]);

  const q = questions[index];
  const canAnswer = Boolean(q?.question && Array.isArray(q?.options) && q.options.length === 4);

  useEffect(() => {
    if (started && q?.question) {
      speakText([t('birdGuideAssessment'), q.question], i18n.language, false, true).catch(() => {});
    }
  }, [started, index, q?.question, i18n.language, t]);

  async function submitAll(finalAnswers) {
    setBusy(true);
    try {
      const payload = Object.entries(finalAnswers).map(([question_id, answer_index]) => ({
        question_id,
        answer_index,
      }));
      const res = await api.submitAssessment(payload);
      refreshUser(res.user);
      setResult(res);
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (selected == null || !q || !canAnswer) return;
    const nextAnswers = { ...answers, [q.id]: selected };
    setAnswers(nextAnswers);
    setSelected(null);
    if (index + 1 >= questions.length) {
      submitAll(nextAnswers);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (result) {
    return (
      <motion.div className="glass-card mx-auto max-w-2xl rounded-3xl p-8 text-center border-2 border-[#032038]/20 shadow-xl space-y-5" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <GuideBird message={`${result.score}% · ${t(`pathLabels.${result.path}`)}`} mood="cheer" size={64} />
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#055f9e] bg-[#055f9e]/15 px-3 py-1 rounded-full border border-[#055f9e]/30">
            Assessment Complete
          </span>
          <h1 className="display mt-3 text-4xl sm:text-5xl font-black text-[#032038]">{result.score}%</h1>
          <p className="mt-2 text-xl font-black text-[#032038]">{result.recommended_course?.title}</p>
          <p className="mt-2 text-sm font-bold text-[#032038]/75 max-w-lg mx-auto">{result.recommended_course?.objective}</p>
        </div>
        <button className="btn-primary mt-6 px-8 py-3.5 text-base font-black shadow-lg cursor-pointer" type="button" onClick={() => navigate('/courses')}>
          {t('goCourses')}
        </button>
      </motion.div>
    );
  }

  if (!started) {
    return (
      <div className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <PageTitle eyebrow="LiteraAI" title={t('assessment')} subtitle={t('assessmentIntro')} />
          </div>
          <GuideBird message={t('birdGuideAssessment')} size={48} />
        </div>
        <motion.div className="glass-card w-full rounded-3xl p-5 sm:p-7 border-2 border-[#032038]/20 shadow-lg space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm sm:text-base font-bold text-[#032038]/85 leading-relaxed">
            Answer a few quick questions so we can personalize your literacy learning track and courses.
          </p>
          <button className="btn-primary px-8 py-3 text-sm sm:text-base font-black shadow-lg cursor-pointer" type="button" onClick={() => setStarted(true)}>
            {t('startAssessment')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col justify-between space-y-3 pb-1 h-[calc(100vh-105px)] min-h-[520px]">
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div>
          <PageTitle
            title={t('assessment')}
            subtitle={t('questionOf', { current: Math.min(index + 1, questions.length || 10), total: questions.length || 10 })}
          />
        </div>
        <GuideBird
          key={index}
          message={t('birdGuideAssessment')}
          mood="think"
          size={46}
          autoSpeak={false}
          onSpeechEnd={() => q && speakText(q.question, i18n.language).catch(() => {})}
        />
      </div>

      <div className="space-y-1.5 shrink-0">
        <div className="flex justify-between text-xs font-black text-[#032038]">
          <span>Progress</span>
          <span className="text-[#055f9e] font-black">{Math.min(index + 1, questions.length)} / {questions.length}</span>
        </div>
        <ProgressBar value={Math.min(index + 1, questions.length)} max={questions.length || 1} label={t('assessment')} />
      </div>

      {error ? <div className="banner-err rounded-2xl p-3 font-bold border-2 shrink-0">{error}</div> : null}

      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {q ? (
            <motion.div
              key={q.id}
              className="glass-card rounded-3xl p-6 sm:p-8 border-2 border-[#032038]/20 shadow-xl flex-1 flex flex-col justify-between h-full"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
            >
              {canAnswer ? (
                <div className="grid gap-6 md:grid-cols-12 items-center flex-1 h-full">
                  {/* Left Column: Question above Image */}
                  <div className="md:col-span-5 flex flex-col h-full gap-3 py-1">
                    <div className="rounded-2xl bg-white/80 p-4 border-2 border-[#032038]/15 shadow-xs flex items-center justify-between gap-3 shrink-0">
                      <h2
                        className="display cursor-pointer text-lg sm:text-xl md:text-2xl font-black leading-snug text-[#032038] hover:text-[#055f9e]"
                        onClick={() => speakText(q.question, i18n.language)}
                        title={t('listen')}
                      >
                        {q.question}
                      </h2>
                      <SpeakButton text={q.question} label="" className="shrink-0 p-2.5 rounded-xl border border-[#032038]/20 hover:bg-white cursor-pointer" />
                    </div>

                    <div className="flex-1 w-full rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[200px]">
                      <QuestionImage imageKey={q.image} question={q.question} questionId={q.id} className="w-full h-full flex-1 border-2 border-[#032038]/15" />
                    </div>
                  </div>

                  {/* Right Column: 4 Options & Action Button */}
                  <div className="md:col-span-7 flex flex-col justify-between h-full space-y-3 py-2">
                    <div className="grid gap-3 flex-1">
                      {q.options.map((opt, optIndex) => (
                        <button
                          key={`${q.id}-${optIndex}`}
                          type="button"
                          data-no-voice-guide="true"
                          className={`option py-3.5 sm:py-4 px-5 text-base sm:text-lg font-black cursor-pointer border-2 flex items-center transition-all ${selected === optIndex ? 'selected shadow-md scale-101' : 'hover:bg-white/90'}`}
                          onClick={() => setSelected(optIndex)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <button className="btn-primary w-full py-4 text-base sm:text-lg font-black shadow-xl cursor-pointer hover:scale-101 transition-all shrink-0" type="button" disabled={selected == null || busy} onClick={next}>
                      {index + 1 >= questions.length ? t('seeResults') : t('continue')}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="font-extrabold text-[#7a1f1f]">{t('assessmentBroken')}</p>
              )}
            </motion.div>
          ) : (
            <div className="mt-8 text-center font-extrabold text-[#06304f]/70">{t('loading')}</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
