import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function Checkpoint() {
  const { courseId } = useParams();
  const { t, i18n } = useTranslation();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getCourse(courseId)
      .then((res) => {
        setQuestions(res.course.checkpoint_test || []);
        setCourseTitle(res.course.title);
        if ((res.progress?.lessons_completed || []).length < (res.course?.lessons?.length || 0)) {
          setError(t('error'));
        }
      })
      .catch((err) => setError(err.message));
  }, [courseId, t]);

  async function finish(finalAnswers) {
    setBusy(true);
    try {
      const res = await api.checkpoint(courseId, finalAnswers);
      refreshUser(res.user);
      setResult(res);
      if (res.passed) confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (selected == null) return;
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);
    setSelected(null);
    if (index + 1 >= questions.length) finish(nextAnswers);
    else setIndex((i) => i + 1);
  }

  if (result) {
    return (
      <motion.div className="glass-card mx-auto max-w-xl rounded-[28px] p-6 text-center" initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <GuideBird message={result.passed ? t('passed') : t('failed')} mood={result.passed ? 'cheer' : 'think'} />
        <h1 className="display text-4xl font-bold">{t('score')}: {result.score}%</h1>
        <p className="mt-2 font-extrabold text-[#06304f]/65">{courseTitle}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {result.passed ? (
            <button className="btn-primary" type="button" onClick={() => navigate('/certificate')}>{t('certificate')}</button>
          ) : (
            <button className="btn-primary" type="button" onClick={() => window.location.reload()}>{t('retakeTest')}</button>
          )}
          <button className="btn-ghost" type="button" onClick={() => navigate('/dashboard')}>{t('goDashboard')}</button>
        </div>
      </motion.div>
    );
  }

  const q = questions[index];

  useEffect(() => {
    if (q?.question) {
      speakText([t('birdGuideAssessment'), q.question], i18n.language, false, true).catch(() => {});
    }
  }, [index, q?.question, i18n.language, t]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <PageTitle title={t('checkpoint')} subtitle={courseTitle} />
        </div>
        <GuideBird
          key={index}
          message={t('birdGuideAssessment')}
          mood="think"
          autoSpeak={false}
          size={48}
        />
      </div>
      {error ? (
        <div className="glass-card mb-4 rounded-2xl p-4 font-extrabold text-[#7a1f1f]">
          {error}
          <div className="mt-3">
            <button className="btn-ghost" type="button" onClick={() => navigate(`/course/${courseId}`)}>{t('back')}</button>
          </div>
        </div>
      ) : null}

      {!error && q ? (
        <AnimatePresence mode="wait">
            <motion.div
              key={index}
              className="glass-card mt-3 rounded-[28px] p-4 md:p-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <div className="grid gap-4 md:grid-cols-12 items-start">
                {/* Left Column: Image & Question */}
                <div className="md:col-span-5 space-y-3">
                  <QuestionImage imageKey={q.image} question={q.question} questionId={q.id} className="h-32 w-full sm:h-36 md:h-40" />
                  <div className="flex items-start justify-between gap-2">
                    <h2
                      className="display cursor-pointer text-lg md:text-xl font-bold leading-snug hover:text-[#0b6fb8]"
                      onClick={() => speakText(q.question, i18n.language)}
                      title={t('listen')}
                    >
                      {q.question}
                    </h2>
                    <SpeakButton text={q.question} label="" className="shrink-0 px-2 py-1" />
                  </div>
                </div>

                {/* Right Column: Options & Submit/Next Button */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#06304f]/55">
                    {t('questionOf', { current: index + 1, total: questions.length })}
                  </div>
                  <div className="grid gap-2">
                    {q.options.map((opt, optIndex) => (
                      <button
                        key={optIndex}
                        type="button"
                        data-no-voice-guide="true"
                        className={`option py-2 px-3 text-xs sm:text-sm ${selected === optIndex ? 'selected' : ''}`}
                        onClick={() => {
                          setSelected(optIndex);
                          if (optIndex === q.correct_index) {
                            speakText(t('correctCheer'), i18n.language).catch(() => {});
                          } else {
                            speakText(opt, i18n.language).catch(() => {});
                          }
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button className="btn-primary mt-3 w-full py-2.5 text-xs sm:text-sm" type="button" disabled={selected == null || busy} onClick={next}>
                    {index + 1 >= questions.length ? t('seeResults') : t('continue')}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
    </div>
  );
}
