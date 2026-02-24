import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Timer from '../components/Timer';

/* ─── tiny helpers ────────────────────────────────────────────── */
const LABELS = ['A', 'B', 'C', 'D', 'E'];

function OptionBtn({ label, text, selected, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer
                ${selected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/50'
                }`}
        >
            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-0.5 transition-colors
                ${selected ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-300 text-gray-500'}`}>
                {label}
            </span>
            <span className={`text-sm leading-relaxed pt-1 ${selected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                {text}
            </span>
        </button>
    );
}

function PaletteButton({ num, state, onClick }) {
    const styles = {
        current: 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1 scale-110',
        answered: 'bg-green-500 text-white hover:bg-green-600',
        unanswered: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    };
    return (
        <button
            onClick={onClick}
            className={`aspect-square rounded-lg text-xs font-bold transition-all duration-150 ${styles[state]}`}
        >
            {num}
        </button>
    );
}

/* ─── main component ──────────────────────────────────────────── */
const TestInterface = () => {
    const { testId, attemptId } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [sectionTimeLeft, setSectionTimeLeft] = useState(0);
    const [paletteOpen, setPaletteOpen] = useState(false); // mobile drawer

    /* fetch */
    useEffect(() => {
        const fetchTest = async () => {
            try {
                const data = await api.startTest(testId);
                setTest(data.test);
                setQuestions(data.questions);
                if (data.test.sections.length > 0) {
                    setSectionTimeLeft(data.test.sections[0].duration * 60);
                }
            } catch {
                alert('Error loading test.');
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [testId]);

    /* section submit */
    const submitCurrentSection = useCallback(async (autoMove = false) => {
        if (!test) return;
        const currentSectionName = test.sections[currentSectionIndex].name;
        const sectionQuestions = questions.filter(q => q.sectionName === currentSectionName);
        const sectionResponses = sectionQuestions
            .map(q => ({ questionId: q._id, selectedOptionIndex: responses[q._id], timeTaken: 0 }))
            .filter(r => r.selectedOptionIndex !== undefined);

        try {
            await api.submitSection(attemptId, sectionResponses);
            if (autoMove && currentSectionIndex < test.sections.length - 1) {
                setCurrentSectionIndex(prev => {
                    const next = prev + 1;
                    setSectionTimeLeft(test.sections[next].duration * 60);
                    setCurrentQuestionIndex(0);
                    return next;
                });
            } else if (autoMove) {
                handleSubmitTest(true);
            }
        } catch (err) {
            console.error('Error submitting section', err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [test, currentSectionIndex, questions, responses, attemptId]);

    const handleSectionTimeUp = useCallback(() => {
        if (!test) return;
        if (currentSectionIndex === test.sections.length - 1) {
            handleSubmitTest(true);
        } else {
            submitCurrentSection(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [test, currentSectionIndex, submitCurrentSection]);

    const handleSubmitTest = async (isAuto = false) => {
        if (!isAuto) {
            if (!window.confirm('Are you sure you want to submit the test?')) return;
        }
        const currentSectionName = test.sections[currentSectionIndex].name;
        const sectionQuestions = questions.filter(q => q.sectionName === currentSectionName);
        const sectionResponses = sectionQuestions
            .map(q => ({ questionId: q._id, selectedOptionIndex: responses[q._id] }))
            .filter(r => r.selectedOptionIndex !== undefined);
        try {
            await api.submitSection(attemptId, sectionResponses);
            const resultData = await api.submitTest(attemptId);
            navigate(`/result/${resultData.result._id}`);
        } catch (err) {
            console.error('Submit failed', err);
            if (isAuto) alert('Auto-submit failed. Please submit manually.');
        }
    };

    /* ─── loading ─────────────────────────────────────────────── */
    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading test, please wait…</p>
            </div>
        </div>
    );

    /* ─── derived state ───────────────────────────────────────── */
    const currentSection = test.sections[currentSectionIndex];
    const currentSectionQuestions = questions.filter(q => q.sectionName === currentSection.name);
    const activeQuestion = currentSectionQuestions[currentQuestionIndex];
    const answeredCount = currentSectionQuestions.filter(q => responses[q._id] !== undefined).length;
    const progress = Math.round((answeredCount / currentSectionQuestions.length) * 100);

    const paletteState = (q, idx) => {
        if (idx === currentQuestionIndex) return 'current';
        if (responses[q._id] !== undefined) return 'answered';
        return 'unanswered';
    };

    /* ─── render ──────────────────────────────────────────────── */
    return (
        <div className="flex flex-col h-dvh bg-slate-100 overflow-hidden">

            {/* ── TOP HEADER ─────────────────────────────────── */}
            <header className="bg-white border-b border-gray-200 shadow-sm z-20 flex-shrink-0">
                {/* Row 1: branding + timer + submit */}
                <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5">
                    {/* Left: logo + title */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">Q</div>
                        <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate max-w-[160px] sm:max-w-xs">{test.title}</p>
                            <p className="text-xs text-gray-400 hidden sm:block">
                                Section: <span className="font-semibold text-blue-600">{currentSection.name}</span>
                                {test.sections.length > 1 && <span className="ml-1.5 text-gray-400">({currentSectionIndex + 1}/{test.sections.length})</span>}
                            </p>
                        </div>
                    </div>

                    {/* Right: timer + submit */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Timer
                            key={`${currentSectionIndex}`}
                            durationInSeconds={sectionTimeLeft}
                            onTimeUp={handleSectionTimeUp}
                            className="hidden"
                        />
                        <TimerDisplay durationInSeconds={sectionTimeLeft} onTimeUp={handleSectionTimeUp} />

                        <button
                            onClick={() => handleSubmitTest(false)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                        >
                            Submit
                        </button>
                    </div>
                </div>

                {/* Row 2: section tabs (on small screens, just show active section name) */}
                {test.sections.length > 1 && (
                    <div className="flex gap-1 px-3 sm:px-5 pb-2 overflow-x-auto">
                        {test.sections.map((sec, i) => (
                            <span key={i} className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap transition
                                ${i === currentSectionIndex
                                    ? 'bg-blue-600 text-white'
                                    : i < currentSectionIndex
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-500'
                                }`}>
                                {i < currentSectionIndex ? '✓ ' : ''}{sec.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Progress bar */}
                <div className="h-1 bg-gray-100">
                    <div
                        className="h-full bg-green-500 transition-all duration-500"
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
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                            {/* Meta bar */}
                            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100">
                                <span className="text-sm font-semibold text-gray-600">
                                    Q <span className="text-blue-600 text-base font-bold">{currentQuestionIndex + 1}</span>
                                    <span className="text-gray-400 font-normal"> / {currentSectionQuestions.length}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">+{activeQuestion?.marks}</span>
                                    <span className="text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">−{activeQuestion?.negativeMarks}</span>
                                </div>
                            </div>

                            {/* Question Text */}
                            <div className="px-4 sm:px-6 py-5">
                                <p className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed">{activeQuestion?.text}</p>
                            </div>

                            {/* Options */}
                            <div className="px-4 sm:px-6 pb-5 space-y-2.5">
                                {activeQuestion?.options.map((opt, idx) => (
                                    <OptionBtn
                                        key={idx}
                                        label={LABELS[idx]}
                                        text={opt}
                                        selected={responses[activeQuestion._id] === idx}
                                        onClick={() => setResponses(prev => ({ ...prev, [activeQuestion._id]: idx }))}
                                    />
                                ))}
                            </div>

                            {/* Navigation footer */}
                            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))}
                                    disabled={currentQuestionIndex === 0}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 px-4 py-2 rounded-lg disabled:opacity-40 transition"
                                >
                                    ← Prev
                                </button>

                                <button
                                    onClick={() => setResponses(prev => { const n = { ...prev }; delete n[activeQuestion._id]; return n; })}
                                    className="text-xs font-semibold text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 px-3 py-2 rounded-lg transition"
                                >
                                    Clear
                                </button>

                                {currentQuestionIndex < currentSectionQuestions.length - 1 ? (
                                    <button
                                        onClick={() => setCurrentQuestionIndex(p => p + 1)}
                                        className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
                                    >
                                        Save & Next →
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => submitCurrentSection(currentSectionIndex < test.sections.length - 1)}
                                        className="flex items-center gap-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
                                    >
                                        {currentSectionIndex < test.sections.length - 1 ? 'Next Section →' : 'Finish Section ✓'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mobile: palette toggle */}
                        <button
                            onClick={() => setPaletteOpen(true)}
                            className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm"
                        >
                            <span>Question Palette</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">{answeredCount} done</span>
                                <span className="text-gray-400">↑</span>
                            </div>
                        </button>
                    </div>
                </main>

                {/* ── SIDEBAR PALETTE (desktop) ──────────────── */}
                <aside className="hidden lg:flex w-64 flex-col bg-white border-l border-gray-200 flex-shrink-0">
                    <PalettePanel
                        questions={currentSectionQuestions}
                        responses={responses}
                        currentIndex={currentQuestionIndex}
                        answeredCount={answeredCount}
                        paletteState={paletteState}
                        onSelect={setCurrentQuestionIndex}
                    />
                </aside>

                {/* ── MOBILE PALETTE DRAWER ──────────────────── */}
                {paletteOpen && (
                    <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/40" onClick={() => setPaletteOpen(false)} />
                        {/* Sheet */}
                        <div className="relative bg-white rounded-t-2xl shadow-xl max-h-[70vh] flex flex-col">
                            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                                <h3 className="font-bold text-gray-800">Question Palette</h3>
                                <button onClick={() => setPaletteOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <PalettePanel
                                    questions={currentSectionQuestions}
                                    responses={responses}
                                    currentIndex={currentQuestionIndex}
                                    answeredCount={answeredCount}
                                    paletteState={paletteState}
                                    onSelect={(i) => { setCurrentQuestionIndex(i); setPaletteOpen(false); }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Palette Panel (shared between desktop + mobile) ─────────── */
function PalettePanel({ questions, responses, currentIndex, answeredCount, paletteState, onSelect }) {
    return (
        <>
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="font-bold text-gray-700 text-sm">Question Palette</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-green-600 font-bold">{answeredCount} answered</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{questions.length - answeredCount} remaining</span>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => (
                        <PaletteButton
                            key={q._id}
                            num={idx + 1}
                            state={paletteState(q, idx)}
                            onClick={() => onSelect(idx)}
                        />
                    ))}
                </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 space-y-1.5 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-3 h-3 rounded bg-green-500" /> Answered</div>
                <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-3 h-3 rounded bg-gray-200 border border-gray-300" /> Not Answered</div>
                <div className="flex items-center gap-2 text-xs text-gray-500"><div className="w-3 h-3 rounded bg-blue-600 ring-2 ring-blue-400 ring-offset-1" /> Current</div>
            </div>
        </>
    );
}

/* ─── Self-contained visible timer (not just the hook) ────────── */
function TimerDisplay({ durationInSeconds, onTimeUp }) {
    const [timeLeft, setTimeLeft] = useState(durationInSeconds);

    useEffect(() => { setTimeLeft(durationInSeconds); }, [durationInSeconds]);

    useEffect(() => {
        if (timeLeft <= 0) { onTimeUp(); return; }
        const id = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(id);
    }, [timeLeft, onTimeUp]);

    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');
    const urgent = timeLeft < 60;
    const warning = timeLeft < 300;

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold transition-colors
            ${urgent
                ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                : warning
                    ? 'bg-orange-50 border-orange-200 text-orange-600'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {mins}:{secs}
        </div>
    );
}

export default TestInterface;
