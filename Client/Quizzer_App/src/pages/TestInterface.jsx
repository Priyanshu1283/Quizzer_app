import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';

/* ─── tiny helpers ────────────────────────────────────────────── */
const LABELS = ['A', 'B', 'C', 'D', 'E'];

function OptionBtn({ label, text, selected, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-150
                ${selected
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/50'
                    : 'border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-blue-500/50 dark:hover:bg-slate-700/80'
                } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
        >
            <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors
                ${selected ? 'bg-blue-600 text-white dark:bg-blue-500' : 'border-2 border-gray-300 bg-white text-gray-500 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {label}
            </span>
            <span className={`pt-1 text-sm leading-relaxed ${selected ? 'font-medium text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-slate-300'}`}>
                {text}
            </span>
        </button>
    );
}

function PaletteButton({ num, state, disabled }) {
    const styles = {
        current: 'scale-110 bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1 dark:bg-blue-500 dark:ring-blue-500',
        answered: 'bg-green-500 text-white dark:bg-green-600',
        unanswered: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
    };
    return (
        <button
            disabled
            className={`aspect-square rounded-lg text-xs font-bold transition-all duration-150 ${styles[state]} ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
        >
            {num}
        </button>
    );
}

const TestInterface = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [question, setQuestion] = useState(null);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [examEndsAt, setExamEndsAt] = useState(null);
    const [perQuestionSeconds, setPerQuestionSeconds] = useState(0);
    const [examTimeLeft, setExamTimeLeft] = useState(0);
    const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(true);

    const questionStartRef = useRef(Date.now());
    const autoSubmitLockRef = useRef(false);

    const recordWarning = useCallback(async (reason) => {
        try {
            await api.recordAttemptWarning(attemptId, reason);
        } catch (err) {
            console.error("Failed to record warning", err);
        }
    }, [attemptId]);

    /* fetch attempt state */
    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                const data = await api.getAttemptState(attemptId);
                setTest(data.test);
                setQuestion(data.question);
                setQuestionIndex(data.questionIndex || 0);
                setTotalQuestions(data.totalQuestions || 0);
                setExamEndsAt(data.attempt?.examEndsAt);
                setPerQuestionSeconds(data.attempt?.perQuestionSeconds || 0);
                setSelectedOptionIndex(undefined);
                if (data.attempt?.examEndsAt) {
                    const secs = Math.max(0, Math.ceil((new Date(data.attempt.examEndsAt).getTime() - Date.now()) / 1000));
                    setExamTimeLeft(secs);
                }
                setQuestionTimeLeft(data.attempt?.perQuestionSeconds || 0);
                questionStartRef.current = Date.now();
            } catch {
                alert('Error loading test.');
            } finally {
                setLoading(false);
            }
        };
        fetchAttempt();
    }, [attemptId]);

    /* exam timer */
    useEffect(() => {
        if (!examEndsAt) return;
        const id = setInterval(() => {
            const secs = Math.max(0, Math.ceil((new Date(examEndsAt).getTime() - Date.now()) / 1000));
            setExamTimeLeft(secs);
        }, 1000);
        return () => clearInterval(id);
    }, [examEndsAt]);

    useEffect(() => {
        if (examTimeLeft <= 0 && !autoSubmitLockRef.current && !loading) {
            autoSubmitLockRef.current = true;
            handleSubmitTest(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examTimeLeft, loading]);

    /* question timer */
    useEffect(() => {
        if (!perQuestionSeconds) return;
        questionStartRef.current = Date.now();
        setQuestionTimeLeft(perQuestionSeconds);
    }, [question?._id, perQuestionSeconds]);

    useEffect(() => {
        if (!perQuestionSeconds || !question) return;
        const id = setInterval(() => {
            const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000);
            const left = Math.max(0, perQuestionSeconds - elapsed);
            setQuestionTimeLeft(left);
        }, 1000);
        return () => clearInterval(id);
    }, [perQuestionSeconds, question]);

    useEffect(() => {
        if (questionTimeLeft <= 0 && question && !isSubmitting) {
            handleSubmitAnswer(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionTimeLeft, question]);

    /* anti-cheat: back navigation */
    useEffect(() => {
        window.history.pushState(null, "", window.location.href);
        const onPopState = () => {
            window.history.pushState(null, "", window.location.href);
            recordWarning("back-navigation");
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [recordWarning]);

    /* anti-cheat: tab switching */
    useEffect(() => {
        const onVisibility = () => {
            if (document.hidden) {
                recordWarning("tab-switch");
            }
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, [recordWarning]);

    /* anti-cheat: fullscreen */
    useEffect(() => {
        const onFullscreenChange = () => {
            const active = !!document.fullscreenElement;
            setIsFullscreen(active);
            if (!active) {
                recordWarning("fullscreen-exit");
            }
        };
        document.addEventListener("fullscreenchange", onFullscreenChange);
        setIsFullscreen(!!document.fullscreenElement);
        return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
    }, [recordWarning]);

    const requestFullscreen = useCallback(() => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    }, []);

    const handleSubmitAnswer = useCallback(async (isAuto = false) => {
        if (!question || isSubmitting) return;
        setIsSubmitting(true);
        const timeSpentSeconds = Math.max(0, Math.min(perQuestionSeconds, perQuestionSeconds - questionTimeLeft));
        try {
            const result = await api.submitAnswer(
                attemptId,
                question._id,
                selectedOptionIndex,
                timeSpentSeconds
            );
            if (result.isCompleted && result.result?._id) {
                navigate(`/result/${result.result._id}`);
                return;
            }
            setQuestion(result.question);
            setQuestionIndex(result.questionIndex);
            setTotalQuestions(result.totalQuestions);
            setSelectedOptionIndex(undefined);
        } catch (err) {
            console.error('Error submitting answer', err);
            if (!isAuto) alert('Failed to save answer. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [attemptId, question, selectedOptionIndex, perQuestionSeconds, questionTimeLeft, isSubmitting, navigate]);

    const handleSubmitTest = async (isAuto = false) => {
        if (!isAuto) {
            if (!window.confirm('Are you sure you want to submit the test?')) return;
        }
        try {
            const resultData = await api.submitTest(attemptId);
            navigate(`/result/${resultData.result._id}`);
        } catch (err) {
            console.error('Submit failed', err);
            if (isAuto) alert('Auto-submit failed. Please submit manually.');
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-400" />
                <p className="text-sm text-gray-500 dark:text-slate-400">Loading test, please wait…</p>
            </div>
        </div>
    );

    const answeredCount = Math.min(questionIndex, totalQuestions);
    const progress = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    const paletteState = (idx) => {
        if (idx === questionIndex) return 'current';
        if (idx < questionIndex) return 'answered';
        return 'unanswered';
    };

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">

            {/* ── TOP HEADER ─────────────────────────────────── */}
            <header className="z-20 flex-shrink-0 border-b border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                {/* Row 1: branding + timer + submit */}
                <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5">
                    {/* Left: logo + title */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white dark:bg-blue-500">Q</div>
                        <div className="min-w-0">
                            <p className="max-w-[160px] truncate text-sm font-bold text-gray-900 dark:text-slate-100 sm:max-w-xs">{test.title}</p>
                            <p className="hidden text-xs text-gray-400 dark:text-slate-500 sm:block">
                                Question <span className="font-semibold text-blue-600 dark:text-blue-400">{questionIndex + 1}</span> of {totalQuestions}
                            </p>
                        </div>
                    </div>

                    {/* Right: timers + submit */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <TimerDisplay label="Exam" durationInSeconds={examTimeLeft} />
                        <TimerDisplay label="Question" durationInSeconds={questionTimeLeft} />

                        <button
                            onClick={() => handleSubmitTest(false)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                        >
                            Submit
                        </button>
                    </div>
                </div>

                {/* Row 2: section tabs (on small screens, just show active section name) */}
                {test?.sections?.length > 1 && (
                    <div className="flex gap-1 px-3 sm:px-5 pb-2 overflow-x-auto">
                        {test.sections.map((sec, i) => (
                            <span key={i} className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition
                                ${i === 0
                                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                                    : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                {sec.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Progress bar */}
                <div className="h-1 bg-gray-100 dark:bg-slate-800">
                    <div
                        className="h-full bg-green-500 transition-all duration-500 dark:bg-green-600"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </header>

            {/* ── BODY ───────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* ── QUESTION AREA ─────────────────────────── */}
                <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
                    <div className="max-w-2xl mx-auto space-y-4">

                        {/* Question Card */}
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">

                            {/* Meta bar */}
                            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-6 dark:border-slate-700 dark:bg-slate-800/80">
                                <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                                    Q <span className="text-base font-bold text-blue-600 dark:text-blue-400">{questionIndex + 1}</span>
                                    <span className="font-normal text-gray-400 dark:text-slate-500"> / {totalQuestions}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-950/60 dark:text-green-300">+{question?.marks}</span>
                                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-950/60 dark:text-red-300">−{question?.negativeMarks}</span>
                                </div>
                            </div>

                            {/* Question Text */}
                            <div className="px-4 py-5 sm:px-6">
                                <p className="text-base font-medium leading-relaxed text-gray-900 dark:text-slate-100 sm:text-lg">{question?.text}</p>
                            </div>

                            {/* Options */}
                            <div className="px-4 sm:px-6 pb-5 space-y-2.5">
                                {question?.options.map((opt, idx) => (
                                    <OptionBtn
                                        key={idx}
                                        label={LABELS[idx]}
                                        text={opt}
                                        selected={selectedOptionIndex === idx}
                                        onClick={() => setSelectedOptionIndex(idx)}
                                        disabled={!isFullscreen}
                                    />
                                ))}
                            </div>

                            {/* Navigation footer */}
                            <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/50 sm:px-6">
                                <button
                                    onClick={() => setSelectedOptionIndex(undefined)}
                                    className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-600 transition hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 dark:hover:bg-yellow-950/60"
                                >
                                    Clear
                                </button>

                                <button
                                    onClick={() => handleSubmitAnswer(false)}
                                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    disabled={!isFullscreen || isSubmitting}
                                >
                                    Save & Next →
                                </button>
                            </div>
                        </div>

                        {/* Mobile: palette toggle */}
                        <button
                            onClick={() => setPaletteOpen(true)}
                            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 lg:hidden"
                        >
                            <span>Question Palette</span>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-950/60 dark:text-green-300">{answeredCount} done</span>
                                <span className="text-gray-400 dark:text-slate-500">↑</span>
                            </div>
                        </button>
                    </div>
                </main>

                {/* ── SIDEBAR PALETTE (desktop) ──────────────── */}
                <aside className="hidden w-64 flex-shrink-0 flex-col border-l border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:flex">
                    <PalettePanel
                        totalQuestions={totalQuestions}
                        currentIndex={questionIndex}
                        answeredCount={answeredCount}
                        paletteState={paletteState}
                    />
                </aside>

                {/* ── MOBILE PALETTE DRAWER ──────────────────── */}
                {paletteOpen && (
                    <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/40" onClick={() => setPaletteOpen(false)} />
                        {/* Sheet */}
                        <div className="relative flex max-h-[70vh] flex-col rounded-t-2xl bg-white shadow-xl dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-3 pt-4 dark:border-slate-700">
                                <h3 className="font-bold text-gray-800 dark:text-slate-100">Question Palette</h3>
                                <button onClick={() => setPaletteOpen(false)} className="text-xl leading-none text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300">✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <PalettePanel
                                    totalQuestions={totalQuestions}
                                    currentIndex={questionIndex}
                                    answeredCount={answeredCount}
                                    paletteState={paletteState}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {!isFullscreen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700">
                        <p className="font-bold text-gray-900 dark:text-white">Full-screen required</p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">Please re-enter full-screen mode to continue the test.</p>
                        <button
                            onClick={requestFullscreen}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            Enter Full-screen
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Palette Panel (shared between desktop + mobile) ─────────── */
function PalettePanel({ totalQuestions, currentIndex, answeredCount, paletteState }) {
    return (
        <>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-sm font-bold text-gray-700 dark:text-slate-200">Question Palette</p>
                <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">{answeredCount} answered</span>
                    <span className="text-gray-300 dark:text-slate-600">·</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">{Math.max(0, totalQuestions - answeredCount)} remaining</span>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: totalQuestions }).map((_, idx) => (
                        <PaletteButton
                            key={idx}
                            num={idx + 1}
                            state={paletteState(idx)}
                            disabled={idx !== currentIndex}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-1.5 border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400"><div className="h-3 w-3 rounded bg-green-500 dark:bg-green-600" /> Answered</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400"><div className="h-3 w-3 rounded border border-gray-300 bg-gray-200 dark:border-slate-500 dark:bg-slate-600" /> Not Answered</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400"><div className="h-3 w-3 rounded bg-blue-600 ring-2 ring-blue-400 ring-offset-1 dark:bg-blue-500" /> Current</div>
            </div>
        </>
    );
}

/* ─── Self-contained visible timer (not just the hook) ────────── */
function TimerDisplay({ label, durationInSeconds }) {
    const timeLeft = Math.max(0, durationInSeconds || 0);
    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');
    const urgent = timeLeft < 60;
    const warning = timeLeft < 300;

    return (
        <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold transition-colors
            ${urgent
                ? 'animate-pulse border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400'
                : warning
                    ? 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300'
                    : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
            }`}>
            <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {mins}:{secs}
        </div>
    );
}

export default TestInterface;
