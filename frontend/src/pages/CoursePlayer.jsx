import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { PageTitle, ProgressBar, FeedbackBanner } from '../components/ui';
import { GuideBird } from '../components/RedBird';
import { QuestionImage } from '../components/QuestionImage';
import { SpeakButton } from '../components/SpeakButton';
import { VoicePractice } from '../components/VoicePractice';
import { speakText } from '../audio';

export default function CoursePlayer() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [error, setError] = useState('');
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    api.getCourse(id)
      .then((res) => {
        setCourse(res.course);
        setProgress(res.progress);
        const completed = res.progress?.lessons_completed || [];
        let start = 0;
        for (let i = 0; i < (res.course?.lessons?.length || 0); i += 1) {
          if (!completed.includes(i)) {
            start = i;
            break;
          }
          start = Math.min(i, (res.course?.lessons?.length || 1) - 1);
        }
        if (completed.length >= (res.course?.lessons?.length || 0)) start = Math.max(0, (res.course?.lessons?.length || 1) - 1);
        setLessonIndex(start);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const lesson = course?.lessons?.[lessonIndex];
  const question = lesson?.practice_questions?.[qIndex];
  const completed = progress?.lessons_completed || [];

  useEffect(() => {
    if (question?.question) {
      speakText([t('birdGuideLesson'), question.question], i18n.language, false, true).catch(() => {});
    }
  }, [lessonIndex, qIndex, question?.question, i18n.language, t]);

  const canAccess = useMemo(() => {
    for (let i = 0; i < lessonIndex; i += 1) {
      if (!completed.includes(i)) return false;
    }
    return true;
  }, [completed, lessonIndex]);

  function check() {
    if (selected == null || !question) return;
    setRevealed(true);
    const isCorrect = selected === question.correct_index;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      speakText(t('correctCheer'), i18n.language).catch(() => {});
    } else {
      speakText(t('tryAgainVoice'), i18n.language).catch(() => {});
    }
  }

  async function advance() {
    if (!revealed) return;
    if (qIndex + 1 < (lesson?.practice_questions?.length || 0)) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      return;
    }

    setFinishing(true);
    try {
      const totalQs = lesson?.practice_questions?.length || 1;
      const finalCorrectCount = correctCount + (selected === question?.correct_index ? 1 : 0);
      const res = await api.lessonProgress(lessonIndex, {
        lesson_index: lessonIndex,
        correct_count: finalCorrectCount,
        total_questions: totalQs,
        course_id: id,
      });
      refreshUser(res.user);
      setProgress({ ...progress, lessons_completed: res.lessons_completed, completion_percent: res.completion_percent });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });

      const totalLessons = course?.lessons?.length || 1;
      if (lessonIndex < totalLessons - 1) {
        setLessonIndex((i) => i + 1);
        setQIndex(0);
        setSelected(null);
        setRevealed(false);
        setCorrectCount(0);
      } else {
        navigate('/certificate');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setFinishing(false);
    }
  }

  if (error) return <div className="banner-err rounded-xl px-3 py-2 font-extrabold">{error}</div>;
  if (!course || !lesson) return <div className="font-extrabold text-[#06304f]/70">{t('loading')}</div>;

  if (!canAccess) {
    return (
      <div className="glass-card rounded-3xl p-6">
        <p className="font-extrabold">{t('error')}</p>
        <button className="btn-primary mt-4" type="button" onClick={() => setLessonIndex(0)}>{t('back')}</button>
      </div>
    );
  }

  const isLastQ = qIndex + 1 >= lesson.practice_questions.length;
  const imageKey = question?.image || lesson.image_key || 'book';

  return (
    <div className="w-full flex-1 flex flex-col justify-between space-y-3 pb-1 h-[calc(100vh-105px)] min-h-[520px]">
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div>
          <PageTitle
            title={lesson.title}
            subtitle={`${course.title} · Lesson ${lessonIndex + 1} of ${course.lessons?.length || 4}`}
          />
        </div>
        <GuideBird
          key={`${lessonIndex}-${qIndex}`}
          message={t('birdGuideLesson')}
          autoSpeak={false}
          size={46}
        />
      </div>

      <div className="space-y-1.5 shrink-0">
        <div className="flex justify-between text-xs font-black text-[#032038]">
          <span>Lesson Progress</span>
          <span className="text-[#055f9e] font-black">Question {qIndex + 1} of {lesson.practice_questions.length}</span>
        </div>
        <ProgressBar value={qIndex + 1} max={lesson.practice_questions.length || 1} label="Question Progress" />
      </div>

      <div className="w-full flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          <motion.section
            key={`${lessonIndex}-${qIndex}`}
            className="glass-card w-full rounded-3xl p-6 sm:p-8 border-2 border-[#032038]/20 shadow-xl flex-1 flex flex-col justify-between h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="grid gap-6 md:grid-cols-12 items-center flex-1 h-full">
              {/* Left Column: Question above Image */}
              <div className="md:col-span-5 flex flex-col h-full gap-3 py-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#055f9e] bg-[#055f9e]/12 px-3 py-1 rounded-full border border-[#055f9e]/25 self-start shrink-0">
                  {t('practice')} · {t('questionOf', { current: qIndex + 1, total: lesson.practice_questions.length })}
                </div>

                <div className="rounded-2xl bg-white/80 p-4 border-2 border-[#032038]/15 shadow-xs flex items-center justify-between gap-3 shrink-0">
                  <h2
                    className="display cursor-pointer text-lg sm:text-xl md:text-2xl font-black leading-snug text-[#032038] hover:text-[#055f9e]"
                    onClick={() => speakText(question.question, i18n.language)}
                    title="Click to hear question"
                  >
                    {question.question}
                  </h2>
                  <SpeakButton text={question.question} label="" className="shrink-0 p-2.5 rounded-xl border border-[#032038]/20 hover:bg-white cursor-pointer" />
                </div>

                <div className="flex-1 w-full rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[200px]">
                  <QuestionImage imageKey={imageKey} question={question.question} questionId={question.id} className="w-full h-full flex-1 border-2 border-[#032038]/15" />
                </div>
              </div>

              {/* Right Column: Options & Check/Next Button */}
              <div className="md:col-span-7 flex flex-col justify-between h-full space-y-3 py-2">
                <div className="grid gap-3 flex-1">
                  {question.options.map((opt, optIndex) => {
                    let cls = 'option py-3.5 sm:py-4 px-5 text-base sm:text-lg font-black border-2 cursor-pointer flex items-center transition-all';
                    if (selected === optIndex) cls += ' selected shadow-md scale-101';
                    if (revealed && optIndex === question.correct_index) cls += ' correct';
                    if (revealed && selected === optIndex && optIndex !== question.correct_index) cls += ' wrong';
                    return (
                      <button
                        key={optIndex}
                        type="button"
                        data-no-voice-guide="true"
                        className={cls}
                        disabled={revealed}
                        onClick={() => setSelected(optIndex)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {revealed ? (
                  <FeedbackBanner
                    correct={selected === question.correct_index}
                    explanation={question.explanation}
                    t={t}
                  />
                ) : null}

                <div className="pt-2 flex flex-wrap gap-2 shrink-0">
                  {!revealed ? (
                    <button className="btn-primary w-full py-4 text-base sm:text-lg font-black shadow-xl cursor-pointer hover:scale-101 transition-all" type="button" disabled={selected == null} onClick={check}>
                      {t('checkAnswer')}
                    </button>
                  ) : (
                    <button className="btn-primary w-full py-4 text-base sm:text-lg font-black shadow-xl cursor-pointer hover:scale-101 transition-all" type="button" disabled={finishing} onClick={advance}>
                      {isLastQ ? (lessonIndex < (course?.lessons?.length || 1) - 1 ? t('nextLesson') : t('getCertificate')) : t('continue')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  );
}
