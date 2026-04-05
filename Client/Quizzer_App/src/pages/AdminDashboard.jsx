import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import ThemeToggle from '../components/ThemeToggle';

const fieldClass =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

function Modal({ title, children, onClose, wide, footer }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center">
            <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 ${
                    wide ? 'max-w-3xl' : 'max-w-lg'
                }`}
            >
                <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                        ✕
                    </button>
                </div>
                <div className="mt-4">{children}</div>
                {footer && <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">{footer}</div>}
            </motion.div>
        </div>
    );
}

function formatDuration(ms) {
    if (ms == null || Number.isNaN(ms) || ms < 0) return '—';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

const USER_PAGE_SIZE = 10;
const STEP_LABELS = ['Series', 'Mock test', 'Question & section', 'Options', 'Correct', 'Review & save'];

export default function AdminDashboard() {
    const [view, setView] = useState('dashboard');
    const [mobileSidebar, setMobileSidebar] = useState(false);
    const [loading, setLoading] = useState(true);

    const [seriesList, setSeriesList] = useState([]);
    const [allMocks, setAllMocks] = useState([]);
    const [usersStats, setUsersStats] = useState([]);
    const [dashStats, setDashStats] = useState({ totalAttempts: 0, uniqueUsers: 0 });

    const [selectedSeriesId, setSelectedSeriesId] = useState('');

    const [lbRows, setLbRows] = useState([]);
    const [lbMockFilter, setLbMockFilter] = useState('');
    const [lbLoading, setLbLoading] = useState(false);

    const [rewardsRows, setRewardsRows] = useState([]);
    const [rewardsLoading, setRewardsLoading] = useState(false);
    const [rewardMockFilter, setRewardMockFilter] = useState('');
    const [genMockId, setGenMockId] = useState('');
    const [genPrizeCount, setGenPrizeCount] = useState(3);
    const [rewardGenLoading, setRewardGenLoading] = useState(false);

    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(1);

    const [qSeriesId, setQSeriesId] = useState('');
    const [qMockId, setQMockId] = useState('');
    const [questionsList, setQuestionsList] = useState([]);
    const [qLoading, setQLoading] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const createMenuRef = useRef(null);
    const [seriesModal, setSeriesModal] = useState(false);
    const [mockModal, setMockModal] = useState(false);
    const [qModal, setQModal] = useState(false);
    const [editMockModal, setEditMockModal] = useState(null);
    const [editQ, setEditQ] = useState(null);

    const [seriesForm, setSeriesForm] = useState({ name: '', description: '', category: '', sortOrder: 0 });
    const [mockForm, setMockForm] = useState({
        testSeriesId: '',
        title: '',
        totalTime: 60,
        price: 0,
        description: '',
        sectionName: 'General',
        sectionDuration: 20,
        sectionQCount: 10,
    });

    const [qStep, setQStep] = useState(1);
    const [qForm, setQForm] = useState({
        seriesId: '',
        mockTestId: '',
        sectionName: '',
        text: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correctOptionIndex: 0,
        marks: 1,
        negativeMarks: 0.25,
    });
    const [mockDetailsForQ, setMockDetailsForQ] = useState(null);

    const loadCore = useCallback(async () => {
        try {
            const [series, mocks, users, perf] = await Promise.all([
                api.getAdminTestSeries(),
                api.getAllMockTestsForAdmin(),
                api.getAdminUsersStats(),
                api.getAdminTopPerformers(),
            ]);
            setSeriesList(series || []);
            setAllMocks(mocks || []);
            setUsersStats(users || []);
            setDashStats(perf?.stats || { totalAttempts: 0, uniqueUsers: 0 });
        } catch (e) {
            console.error(e);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCore();
    }, [loadCore]);

    useEffect(() => {
        if (!createOpen) return;
        const close = (e) => {
            if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
                setCreateOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [createOpen]);

    const loadLeaderboard = useCallback(async () => {
        setLbLoading(true);
        try {
            const data = await api.getAdminLeaderboardResults({
                mockTestId: lbMockFilter || undefined,
                limit: 100,
            });
            setLbRows(data?.leaderboard || []);
        } catch {
            toast.error('Failed to load leaderboard');
            setLbRows([]);
        } finally {
            setLbLoading(false);
        }
    }, [lbMockFilter]);

    useEffect(() => {
        if (view === 'leaderboard') loadLeaderboard();
    }, [view, lbMockFilter, loadLeaderboard]);

    const loadRewards = useCallback(async () => {
        setRewardsLoading(true);
        try {
            const data = await api.getAdminRewards({
                mockTestId: rewardMockFilter || undefined,
            });
            setRewardsRows(data?.rewards || []);
        } catch {
            toast.error('Failed to load rewards');
            setRewardsRows([]);
        } finally {
            setRewardsLoading(false);
        }
    }, [rewardMockFilter]);

    useEffect(() => {
        if (view === 'rewards') loadRewards();
    }, [view, rewardMockFilter, loadRewards]);

    useEffect(() => {
        if (!qMockId) {
            setQuestionsList([]);
            return;
        }
        let c = false;
        setQLoading(true);
        api.getQuestionsForMock(qMockId)
            .then((d) => {
                if (!c) setQuestionsList(Array.isArray(d) ? d : []);
            })
            .catch(() => {
                if (!c) setQuestionsList([]);
            })
            .finally(() => {
                if (!c) setQLoading(false);
            });
        return () => {
            c = true;
        };
    }, [qMockId]);

    useEffect(() => {
        if (!qForm.mockTestId) {
            setMockDetailsForQ(null);
            return;
        }
        api.getMockTestDetailsWithCounts(qForm.mockTestId).then(setMockDetailsForQ).catch(() => setMockDetailsForQ(null));
    }, [qForm.mockTestId]);

    const mocksInSeries = useCallback((sid) => allMocks.filter((m) => String(m.testSeriesId) === String(sid)), [allMocks]);

    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        if (!q) return usersStats;
        return usersStats.filter((u) => {
            const name = `${u.fullname?.firstName || ''} ${u.fullname?.lastName || ''}`.toLowerCase();
            return name.includes(q) || (u.email || '').toLowerCase().includes(q);
        });
    }, [usersStats, userSearch]);

    const userPages = Math.max(1, Math.ceil(filteredUsers.length / USER_PAGE_SIZE));
    const userSlice = useMemo(() => {
        const start = (userPage - 1) * USER_PAGE_SIZE;
        return filteredUsers.slice(start, start + USER_PAGE_SIZE);
    }, [filteredUsers, userPage]);

    useEffect(() => {
        setUserPage(1);
    }, [userSearch, usersStats.length]);

    const openQuestionModal = (presetSeriesId = '', presetMockId = '') => {
        setQStep(1);
        setQForm({
            seriesId: presetSeriesId,
            mockTestId: presetMockId,
            sectionName: '',
            text: '',
            option1: '',
            option2: '',
            option3: '',
            option4: '',
            correctOptionIndex: 0,
            marks: 1,
            negativeMarks: 0.25,
        });
        setQModal(true);
        setCreateOpen(false);
    };

    const submitQuestion = async () => {
        const options = [qForm.option1, qForm.option2, qForm.option3, qForm.option4].map((o) => String(o ?? '').trim());
        const idx = Number(qForm.correctOptionIndex);
        if (!qForm.mockTestId || !mockDetailsForQ) {
            toast.error('Select a mock test');
            return;
        }
        if (!qForm.text?.trim()) {
            toast.error('Enter question text');
            return;
        }
        if (options.some((o) => !o)) {
            toast.error('Fill all options');
            return;
        }
        if (!qForm.sectionName?.trim()) {
            toast.error('Select section');
            return;
        }
        try {
            await api.addQuestion({
                mockTestId: qForm.mockTestId,
                sectionName: qForm.sectionName.trim(),
                text: qForm.text.trim(),
                options,
                correctOptionIndex: idx,
                marks: Number(qForm.marks) || 1,
                negativeMarks: Number(qForm.negativeMarks) ?? 0.25,
            });
            toast.success('Question saved');
            setQModal(false);
            loadCore();
            if (qMockId === qForm.mockTestId) {
                const d = await api.getQuestionsForMock(qForm.mockTestId);
                setQuestionsList(d || []);
            }
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to save');
        }
    };

    const saveSeries = async () => {
        const name = seriesForm.name?.trim();
        if (!name) {
            toast.error('Enter a series title');
            return;
        }
        try {
            await api.createTestSeries({ ...seriesForm, name });
            toast.success('Series created');
            setSeriesModal(false);
            setSeriesForm({ name: '', description: '', category: '', sortOrder: 0 });
            loadCore();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to create series');
        }
    };

    const saveMock = async () => {
        if (!mockForm.testSeriesId) {
            toast.error('Select a test series');
            return;
        }
        if (!mockForm.title?.trim()) {
            toast.error('Enter a mock test title');
            return;
        }
        const totalTime = Number(mockForm.totalTime);
        const price = Number(mockForm.price);
        if (!Number.isFinite(totalTime) || totalTime < 1) {
            toast.error('Duration must be at least 1 minute');
            return;
        }
        const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
        try {
            await api.createMockTest({
                title: mockForm.title.trim(),
                testSeriesId: mockForm.testSeriesId,
                totalTime,
                price: safePrice,
                description: mockForm.description || '',
                sections: [
                    {
                        name: mockForm.sectionName.trim() || 'General',
                        duration: Math.max(1, Number(mockForm.sectionDuration) || 20),
                        totalQuestions: Math.max(1, Number(mockForm.sectionQCount) || 10),
                    },
                ],
            });
            toast.success('Mock test created');
            setMockModal(false);
            setMockForm({
                title: '',
                testSeriesId: mockForm.testSeriesId,
                totalTime: 60,
                price: 0,
                description: '',
                sectionName: 'General',
                sectionDuration: 20,
                sectionQCount: 10,
            });
            loadCore();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to create mock test');
        }
    };

    const saveEditMock = async () => {
        if (!editMockModal) return;
        try {
            await api.updateMockTestAdmin(editMockModal._id, {
                title: editMockModal.title,
                totalTime: Number(editMockModal.totalTime),
                price: Number(editMockModal.price),
                description: editMockModal.description,
            });
            toast.success('Mock updated');
            setEditMockModal(null);
            loadCore();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed');
        }
    };

    const qMocks = useMemo(() => mocksInSeries(qForm.seriesId), [mocksInSeries, qForm.seriesId]);

    const pageVariants = {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
            <AdminSidebar
                active={view}
                onNavigate={setView}
                mobileOpen={mobileSidebar}
                onCloseMobile={() => setMobileSidebar(false)}
            />

            <div className="md:pl-[260px]">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
                            onClick={() => setMobileSidebar(true)}
                            aria-label="Open menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">Admin Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div ref={createMenuRef} className="relative z-[120]">
                            <Button
                                type="button"
                                aria-expanded={createOpen}
                                aria-haspopup="menu"
                                onClick={() => setCreateOpen((o) => !o)}
                                className="bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
                            >
                                + Create test
                            </Button>
                            <AnimatePresence>
                                {createOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        role="menu"
                                        className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5 dark:border-slate-600 dark:bg-slate-800 dark:ring-white/10"
                                    >
                                        <button
                                            type="button"
                                            role="menuitem"
                                            className="block w-full px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                                            onClick={() => {
                                                setSeriesModal(true);
                                                setCreateOpen(false);
                                            }}
                                        >
                                            New test series
                                        </button>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            className="block w-full px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                                            onClick={() => {
                                                setMockModal(true);
                                                setCreateOpen(false);
                                            }}
                                        >
                                            New mock test
                                        </button>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            className="block w-full px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                                            onClick={() => {
                                                openQuestionModal();
                                                setCreateOpen(false);
                                            }}
                                        >
                                            Add question
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-8">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {view === 'dashboard' && (
                                <motion.section key="dash" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        {[
                                            { label: 'Test series', value: seriesList.length, color: 'from-blue-600 to-indigo-600' },
                                            { label: 'Mock tests', value: allMocks.length, color: 'from-violet-600 to-purple-600' },
                                            { label: 'Registered users', value: usersStats.length, color: 'from-emerald-600 to-teal-600' },
                                            { label: 'Total attempts', value: dashStats.totalAttempts, color: 'from-amber-500 to-orange-600' },
                                        ].map((c) => (
                                            <motion.div
                                                key={c.label}
                                                layout
                                                className={`rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg ${c.color}`}
                                            >
                                                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{c.label}</p>
                                                <p className="mt-2 text-3xl font-black tabular-nums">{c.value}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                                        <h2 className="font-bold text-slate-900 dark:text-white">Quick actions</h2>
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <Button
                                                type="button"
                                                onClick={() => setSeriesModal(true)}
                                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                            >
                                                + New series
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => setMockModal(true)}
                                                className="bg-indigo-600 text-white hover:bg-indigo-700"
                                            >
                                                + New mock test
                                            </Button>
                                            <Button onClick={() => setView('series')} className="bg-slate-800 text-white">
                                                Browse series
                                            </Button>
                                            <Button onClick={() => setView('questions')} className="bg-blue-600 text-white">
                                                Manage questions
                                            </Button>
                                            <Button onClick={() => setView('users')} className="border border-slate-300 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                View users
                                            </Button>
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                            {view === 'series' && (
                                <motion.section key="series" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                                    <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">All test series</h2>
                                    <div className="grid max-h-[70vh] gap-4 overflow-y-auto pb-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {seriesList.map((s) => (
                                            <motion.div
                                                key={s._id}
                                                layout
                                                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{s.name}</h3>
                                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                        {mocksInSeries(s._id).length} tests
                                                    </span>
                                                </div>
                                                {s.category && (
                                                    <p className="mt-1 text-xs font-medium text-violet-600 dark:text-violet-400">{s.category}</p>
                                                )}
                                                <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{s.description || '—'}</p>
                                                <Button
                                                    type="button"
                                                    className="mt-4 w-full border border-blue-200 bg-blue-50 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200"
                                                    onClick={() => {
                                                        setSelectedSeriesId(s._id);
                                                        setView('mocks');
                                                    }}
                                                >
                                                    View mock tests
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.section>
                            )}

                            {view === 'mocks' && (
                                <motion.section key="mocks" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                        <div className="max-w-md flex-1">
                                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Filter by series</label>
                                            <select
                                                className={fieldClass}
                                                value={selectedSeriesId}
                                                onChange={(e) => setSelectedSeriesId(e.target.value)}
                                            >
                                                <option value="">All series</option>
                                                {seriesList.map((s) => (
                                                    <option key={s._id} value={s._id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {allMocks
                                            .filter((m) => !selectedSeriesId || String(m.testSeriesId) === String(selectedSeriesId))
                                            .map((m) => {
                                                const seriesName = seriesList.find((s) => String(s._id) === String(m.testSeriesId))?.name || '—';
                                                return (
                                                    <motion.div
                                                        key={m._id}
                                                        layout
                                                        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
                                                    >
                                                        <p className="text-xs font-medium text-slate-500">{seriesName}</p>
                                                        <h3 className="mt-1 font-bold text-slate-900 dark:text-white">{m.title}</h3>
                                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                            <span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">{m.totalTime} min</span>
                                                            <span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
                                                                {m.questionCount ?? 0} questions
                                                            </span>
                                                            {Number(m.price) > 0 ? (
                                                                <span className="rounded-lg bg-amber-100 px-2 py-1 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                                                    ₹{m.price}
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-lg bg-emerald-100 px-2 py-1 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                                                                    Free
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-4 flex gap-2">
                                                            <Button
                                                                type="button"
                                                                className="flex-1 border border-slate-300 bg-white py-2 text-xs font-semibold dark:border-slate-600 dark:bg-slate-800"
                                                                onClick={() =>
                                                                    setEditMockModal({
                                                                        _id: m._id,
                                                                        title: m.title,
                                                                        totalTime: m.totalTime,
                                                                        price: m.price,
                                                                        description: m.description || '',
                                                                    })
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                className="flex-1 bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                                                onClick={() => {
                                                                    const sid = String(m.testSeriesId);
                                                                    setQSeriesId(sid);
                                                                    setQMockId(m._id);
                                                                    setView('questions');
                                                                    openQuestionModal(sid, m._id);
                                                                }}
                                                            >
                                                                Add questions
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                    </div>
                                </motion.section>
                            )}

                            {view === 'questions' && (
                                <motion.section key="questions" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Questions</h2>
                                        <Button type="button" onClick={() => openQuestionModal(qSeriesId, qMockId)} className="bg-blue-600 text-white">
                                            + Add question (wizard)
                                        </Button>
                                    </div>
                                    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium">Series</label>
                                            <select
                                                className={fieldClass}
                                                value={qSeriesId}
                                                onChange={(e) => {
                                                    setQSeriesId(e.target.value);
                                                    setQMockId('');
                                                }}
                                            >
                                                <option value="">Select…</option>
                                                {seriesList.map((s) => (
                                                    <option key={s._id} value={s._id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium">Mock test</label>
                                            <select
                                                className={fieldClass}
                                                value={qMockId}
                                                onChange={(e) => setQMockId(e.target.value)}
                                                disabled={!qSeriesId}
                                            >
                                                <option value="">Select…</option>
                                                {mocksInSeries(qSeriesId).map((m) => (
                                                    <option key={m._id} value={m._id}>
                                                        {m.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="max-h-[min(520px,60vh)] overflow-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                        {qLoading ? (
                                            <p className="p-8 text-center text-slate-500">Loading…</p>
                                        ) : !qMockId ? (
                                            <p className="p-8 text-center text-slate-500">Select a mock test to list questions.</p>
                                        ) : questionsList.length === 0 ? (
                                            <p className="p-8 text-center text-slate-500">No questions yet.</p>
                                        ) : (
                                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {questionsList.map((q, i) => (
                                                    <li key={q._id} className="p-4">
                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                            <span className="text-xs font-bold text-slate-400">Q{i + 1}</span>
                                                            <button
                                                                type="button"
                                                                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                                                onClick={() =>
                                                                    setEditQ({
                                                                        ...q,
                                                                        option1: q.options?.[0],
                                                                        option2: q.options?.[1],
                                                                        option3: q.options?.[2],
                                                                        option4: q.options?.[3],
                                                                    })
                                                                }
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                        <p className="mt-1 font-medium text-slate-900 dark:text-white">{q.text}</p>
                                                        <ul className="mt-2 space-y-1 text-sm">
                                                            {q.options?.map((o, j) => (
                                                                <li
                                                                    key={j}
                                                                    className={`rounded-lg px-2 py-1 ${
                                                                        j === q.correctOptionIndex
                                                                            ? 'bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                                                                            : 'text-slate-600 dark:text-slate-400'
                                                                    }`}
                                                                >
                                                                    {j + 1}. {o}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </motion.section>
                            )}

                            {view === 'users' && (
                                <motion.section key="users" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Users</h2>
                                    <Input placeholder="Search name or email…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-slate-100 dark:bg-slate-800">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-bold">Name</th>
                                                    <th className="px-4 py-3 text-left font-bold">Email</th>
                                                    <th className="px-4 py-3 text-right font-bold">Attempts</th>
                                                    <th className="px-4 py-3 text-right font-bold">Rewards</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {userSlice.map((u) => (
                                                    <tr key={u._id}>
                                                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                                                            {u.fullname?.firstName} {u.fullname?.lastName}
                                                        </td>
                                                        <td className="max-w-[200px] truncate px-4 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                                                        <td className="px-4 py-3 text-right tabular-nums">{u.testsGiven}</td>
                                                        <td className="px-4 py-3 text-right tabular-nums font-medium text-violet-600 dark:text-violet-400">
                                                            {u.rewardsCount ?? 0}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <span>
                                            Page {userPage} of {userPages} · {filteredUsers.length} users
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                disabled={userPage <= 1}
                                                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                                                className="border border-slate-300 bg-white px-3 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                                            >
                                                Prev
                                            </Button>
                                            <Button
                                                type="button"
                                                disabled={userPage >= userPages}
                                                onClick={() => setUserPage((p) => Math.min(userPages, p + 1))}
                                                className="border border-slate-300 bg-white px-3 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                            {view === 'leaderboard' && (
                                <motion.section key="lb" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Leaderboard</h2>
                                    <div className="max-w-md">
                                        <label className="mb-1 block text-xs font-medium">Filter by mock test</label>
                                        <select
                                            className={fieldClass}
                                            value={lbMockFilter}
                                            onChange={(e) => setLbMockFilter(e.target.value)}
                                        >
                                            <option value="">All mocks</option>
                                            {allMocks.map((m) => (
                                                <option key={m._id} value={m._id}>
                                                    {m.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                        {lbLoading ? (
                                            <p className="p-8 text-center">Loading…</p>
                                        ) : (
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left">Rank</th>
                                                        <th className="px-4 py-3 text-left">Name</th>
                                                        <th className="px-4 py-3 text-left">Test</th>
                                                        <th className="px-4 py-3 text-right">Score</th>
                                                        <th className="px-4 py-3 text-right">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {lbRows.map((row) => (
                                                        <tr key={row._id}>
                                                            <td className="px-4 py-3 font-mono">{row.rank}</td>
                                                            <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                                                                {row.userId?.fullname?.firstName} {row.userId?.fullname?.lastName}
                                                            </td>
                                                            <td className="max-w-[140px] truncate px-4 py-3 text-slate-600 dark:text-slate-400">
                                                                {row.mockTestId?.title}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">{row.score}</td>
                                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                                {formatDuration(row.timeTakenMs)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </motion.section>
                            )}

                            {view === 'rewards' && (
                                <motion.section
                                    key="rewards"
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Rewards</h2>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Generate rewards from leaderboard results for a mock, then mark physical prizes as distributed after students claim
                                            them in the app.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">Generate rewards</h3>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Creates reward rows for the top scorers (by score, then time). Skips users who already have a reward for that mock.
                                        </p>
                                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                                            <div className="min-w-[200px] flex-1">
                                                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Mock test</label>
                                                <select
                                                    className={fieldClass}
                                                    value={genMockId}
                                                    onChange={(e) => setGenMockId(e.target.value)}
                                                >
                                                    <option value="">Select mock…</option>
                                                    {allMocks.map((m) => (
                                                        <option key={m._id} value={m._id}>
                                                            {m.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-full sm:w-28">
                                                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Top N</label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={50}
                                                    value={genPrizeCount}
                                                    onChange={(e) => setGenPrizeCount(+e.target.value || 3)}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                disabled={rewardGenLoading || !genMockId}
                                                onClick={async () => {
                                                    if (!genMockId) return toast.error('Select a mock test');
                                                    setRewardGenLoading(true);
                                                    try {
                                                        const n = Math.min(50, Math.max(1, Number(genPrizeCount) || 3));
                                                        await api.generateRewards(genMockId, n);
                                                        toast.success('Rewards generated');
                                                        loadRewards();
                                                    } catch (e) {
                                                        toast.error(e.response?.data?.message || 'Failed to generate');
                                                    } finally {
                                                        setRewardGenLoading(false);
                                                    }
                                                }}
                                                className="bg-violet-600 text-white hover:bg-violet-700"
                                            >
                                                {rewardGenLoading ? 'Generating…' : 'Generate'}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="max-w-md">
                                        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Filter table by mock</label>
                                        <select
                                            className={fieldClass}
                                            value={rewardMockFilter}
                                            onChange={(e) => setRewardMockFilter(e.target.value)}
                                        >
                                            <option value="">All mocks</option>
                                            {allMocks.map((m) => (
                                                <option key={m._id} value={m._id}>
                                                    {m.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                        {rewardsLoading ? (
                                            <p className="p-8 text-center text-slate-500">Loading…</p>
                                        ) : rewardsRows.length === 0 ? (
                                            <p className="p-8 text-center text-slate-500">
                                                No rewards yet. Generate rewards for a mock with completed attempts.
                                            </p>
                                        ) : (
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left">Student</th>
                                                        <th className="px-4 py-3 text-left">Mock</th>
                                                        <th className="px-4 py-3 text-right">Rank</th>
                                                        <th className="px-4 py-3 text-left">Type</th>
                                                        <th className="px-4 py-3 text-left">Status</th>
                                                        <th className="px-4 py-3 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {rewardsRows.map((r) => (
                                                        <tr key={r._id}>
                                                            <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                                                                {r.userId?.fullname?.firstName} {r.userId?.fullname?.lastName}
                                                                <span className="mt-0.5 block text-xs text-slate-500">{r.userId?.email}</span>
                                                            </td>
                                                            <td className="max-w-[160px] truncate px-4 py-3 text-slate-600 dark:text-slate-400">
                                                                {r.mockTestId?.title || '—'}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono">#{r.rank}</td>
                                                            <td className="px-4 py-3">{r.rewardType}</td>
                                                            <td className="px-4 py-3">
                                                                <span
                                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                                        r.status === 'eligible'
                                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
                                                                            : r.status === 'claimed'
                                                                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
                                                                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                                                                    }`}
                                                                >
                                                                    {r.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {r.status === 'claimed' ? (
                                                                    <button
                                                                        type="button"
                                                                        className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
                                                                        onClick={async () => {
                                                                            try {
                                                                                await api.distributeReward(r._id);
                                                                                toast.success('Marked as distributed');
                                                                                loadRewards();
                                                                            } catch (e) {
                                                                                toast.error(e.response?.data?.message || 'Failed');
                                                                            }
                                                                        }}
                                                                    >
                                                                        Mark distributed
                                                                    </button>
                                                                ) : r.status === 'distributed' ? (
                                                                    <span className="text-xs text-slate-400">Done</span>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">Awaiting claim</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    )}
                </main>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {seriesModal && (
                    <Modal
                        title="Create test series"
                        onClose={() => setSeriesModal(false)}
                        footer={
                            <>
                                <Button type="button" onClick={() => setSeriesModal(false)} className="border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
                                    Cancel
                                </Button>
                                <Button type="button" onClick={saveSeries} className="bg-blue-600 text-white">
                                    Save
                                </Button>
                            </>
                        }
                    >
                        <div className="space-y-3">
                            <Input placeholder="Title" value={seriesForm.name} onChange={(e) => setSeriesForm({ ...seriesForm, name: e.target.value })} />
                            <textarea
                                className={`${fieldClass} min-h-[80px]`}
                                placeholder="Description"
                                value={seriesForm.description}
                                onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                            />
                            <Input
                                placeholder="Category (e.g. Government, Entrance)"
                                value={seriesForm.category}
                                onChange={(e) => setSeriesForm({ ...seriesForm, category: e.target.value })}
                            />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Sort order</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={seriesForm.sortOrder}
                                    onChange={(e) => setSeriesForm({ ...seriesForm, sortOrder: +e.target.value || 0 })}
                                />
                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    Controls where this series appears in lists (student dashboard, catalog).{' '}
                                    <strong className="font-medium text-slate-600 dark:text-slate-300">Lower numbers come first.</strong>{' '}
                                    If two series have the same number, they are sorted by title. Default <code className="rounded bg-slate-100 px-1 dark:bg-slate-700">0</code> is fine; use gaps like 10, 20 if you may insert series between others later.
                                </p>
                            </div>
                        </div>
                    </Modal>
                )}

                {mockModal && (
                    <Modal
                        title="Create mock test"
                        wide
                        onClose={() => setMockModal(false)}
                        footer={
                            <>
                                <Button type="button" onClick={() => setMockModal(false)} className="border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
                                    Cancel
                                </Button>
                                <Button type="button" onClick={saveMock} className="bg-indigo-600 text-white">
                                    Save mock
                                </Button>
                            </>
                        }
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-medium">Test series</label>
                                <select
                                    className={fieldClass}
                                    value={mockForm.testSeriesId}
                                    onChange={(e) => setMockForm({ ...mockForm, testSeriesId: e.target.value })}
                                >
                                    <option value="">Select series…</option>
                                    {seriesList.map((s) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mock title</label>
                                <Input
                                    placeholder="e.g. SSC CGL Mock 1"
                                    value={mockForm.title}
                                    onChange={(e) => setMockForm({ ...mockForm, title: e.target.value })}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">About (optional)</label>
                                <textarea
                                    className={`${fieldClass} min-h-[72px]`}
                                    placeholder="Short description for students"
                                    value={mockForm.description}
                                    onChange={(e) => setMockForm({ ...mockForm, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (minutes)</label>
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="e.g. 60"
                                    value={mockForm.totalTime}
                                    onChange={(e) => setMockForm({ ...mockForm, totalTime: +e.target.value })}
                                />
                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    Total time allowed for the whole mock. The student timer uses this value (minimum 1 minute).
                                </p>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Price ₹ (0 = free)</label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="1"
                                    placeholder="0"
                                    value={mockForm.price}
                                    onChange={(e) => setMockForm({ ...mockForm, price: +e.target.value })}
                                />
                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    Price in rupees. Use <code className="rounded bg-slate-100 px-1 dark:bg-slate-700">0</code> for a free test; any positive amount requires payment before the student can start.
                                </p>
                            </div>
                            <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-600 dark:bg-slate-800/50">
                                <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">First section</p>
                                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                                    New mocks start with one section. When you add questions, you pick this section name so questions belong here. You can align time and question count with the fields below.
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">First section name</label>
                                        <Input
                                            placeholder="e.g. General, Quant"
                                            value={mockForm.sectionName}
                                            onChange={(e) => setMockForm({ ...mockForm, sectionName: e.target.value })}
                                        />
                                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                            Display name for this block. In <strong className="font-medium text-slate-600 dark:text-slate-300">Add question</strong>, choose the same name in the Section dropdown.
                                        </p>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Section duration (min)</label>
                                            <Input
                                                type="number"
                                                min={1}
                                                placeholder="e.g. 60"
                                                value={mockForm.sectionDuration}
                                                onChange={(e) => setMockForm({ ...mockForm, sectionDuration: +e.target.value || 1 })}
                                            />
                                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                Minutes allowed for this section. With a single section, this is usually the same as total mock duration above.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Questions in this section</label>
                                            <Input
                                                type="number"
                                                min={1}
                                                placeholder="e.g. 50"
                                                value={mockForm.sectionQCount}
                                                onChange={(e) => setMockForm({ ...mockForm, sectionQCount: +e.target.value || 1 })}
                                            />
                                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                Planned number of questions for this section. Add that many questions via the wizard, each assigned to this section name.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}

                {qModal && (
                    <Modal
                        title="Add question"
                        wide
                        onClose={() => setQModal(false)}
                        footer={
                            <div className="flex w-full flex-wrap items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    disabled={qStep <= 1}
                                    onClick={() => setQStep((s) => Math.max(1, s - 1))}
                                    className="border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                                >
                                    Back
                                </Button>
                                {qStep < 6 ? (
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (qStep === 1 && !qForm.seriesId) return toast.error('Select series');
                                            if (qStep === 2 && !qForm.mockTestId) return toast.error('Select mock');
                                            if (qStep === 3 && (!qForm.text?.trim() || !qForm.sectionName?.trim()))
                                                return toast.error('Select section and enter question text');
                                            if (qStep === 4 && [qForm.option1, qForm.option2, qForm.option3, qForm.option4].some((x) => !String(x || '').trim()))
                                                return toast.error('All options required');
                                            setQStep((s) => s + 1);
                                        }}
                                        className="bg-blue-600 text-white"
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button type="button" onClick={submitQuestion} className="bg-emerald-600 text-white">
                                        Save question
                                    </Button>
                                )}
                            </div>
                        }
                    >
                        <div className="mb-6 flex gap-1 overflow-x-auto pb-2">
                            {STEP_LABELS.map((label, i) => (
                                <div
                                    key={label}
                                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                                        i + 1 === qStep
                                            ? 'bg-blue-600 text-white'
                                            : i + 1 < qStep
                                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                    }`}
                                >
                                    {i + 1}. {label}
                                </div>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={qStep}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                className="min-h-[200px]"
                            >
                                {qStep === 1 && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Select test series</label>
                                        <select
                                            className={fieldClass}
                                            value={qForm.seriesId}
                                            onChange={(e) =>
                                                setQForm((f) => ({ ...f, seriesId: e.target.value, mockTestId: '', sectionName: '' }))
                                            }
                                        >
                                            <option value="">Choose…</option>
                                            {seriesList.map((s) => (
                                                <option key={s._id} value={s._id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {qStep === 2 && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Select mock test</label>
                                        <select
                                            className={fieldClass}
                                            value={qForm.mockTestId}
                                            onChange={(e) => setQForm((f) => ({ ...f, mockTestId: e.target.value, sectionName: '' }))}
                                        >
                                            <option value="">Choose…</option>
                                            {qMocks.map((m) => (
                                                <option key={m._id} value={m._id}>
                                                    {m.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {qStep === 3 && (
                                    <div className="space-y-3">
                                        {mockDetailsForQ ? (
                                            <div>
                                                <label className="mb-2 block text-sm font-medium">Section</label>
                                                <select
                                                    className={fieldClass}
                                                    value={qForm.sectionName}
                                                    onChange={(e) => setQForm((f) => ({ ...f, sectionName: e.target.value }))}
                                                >
                                                    <option value="">Select section…</option>
                                                    {mockDetailsForQ.sections?.map((s) => (
                                                        <option key={s.name} value={s.name}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                    Must match a section defined on this mock (name, duration, and question count were set at creation). Pick the section this question belongs to.
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-amber-600 dark:text-amber-400">Loading mock sections… pick mock in step 2.</p>
                                        )}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">Question title / text</label>
                                            <textarea
                                                className={`${fieldClass} min-h-[120px]`}
                                                value={qForm.text}
                                                onChange={(e) => setQForm((f) => ({ ...f, text: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                )}
                                {qStep === 4 && (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {[1, 2, 3, 4].map((n) => (
                                            <Input
                                                key={n}
                                                placeholder={`Option ${n}`}
                                                value={qForm[`option${n}`]}
                                                onChange={(e) => setQForm((f) => ({ ...f, [`option${n}`]: e.target.value }))}
                                            />
                                        ))}
                                    </div>
                                )}
                                {qStep === 5 && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Correct option</p>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {[0, 1, 2, 3].map((j) => (
                                                <label
                                                    key={j}
                                                    className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${
                                                        qForm.correctOptionIndex === j
                                                            ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40'
                                                            : 'border-slate-200 dark:border-slate-700'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="correct"
                                                        checked={qForm.correctOptionIndex === j}
                                                        onChange={() => setQForm((f) => ({ ...f, correctOptionIndex: j }))}
                                                    />
                                                    <span>
                                                        {j + 1}. {qForm[`option${j + 1}`] || `Option ${j + 1}`}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {qStep === 6 && (
                                    <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/80">
                                        <p>
                                            <strong>Series:</strong> {seriesList.find((s) => String(s._id) === String(qForm.seriesId))?.name}
                                        </p>
                                        <p>
                                            <strong>Mock:</strong> {qMocks.find((m) => String(m._id) === String(qForm.mockTestId))?.title}
                                        </p>
                                        <p>
                                            <strong>Section:</strong> {qForm.sectionName || '—'}
                                        </p>
                                        <p>
                                            <strong>Question:</strong> {qForm.text}
                                        </p>
                                        <p>
                                            <strong>Correct index:</strong> {qForm.correctOptionIndex}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </Modal>
                )}

                {editMockModal && (
                    <Modal
                        title="Edit mock test"
                        onClose={() => setEditMockModal(null)}
                        footer={
                            <>
                                <Button type="button" onClick={() => setEditMockModal(null)} className="border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
                                    Cancel
                                </Button>
                                <Button type="button" onClick={saveEditMock} className="bg-blue-600 text-white">
                                    Save
                                </Button>
                            </>
                        }
                    >
                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mock title</label>
                                <Input
                                    value={editMockModal.title}
                                    onChange={(e) => setEditMockModal({ ...editMockModal, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (minutes)</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        placeholder="e.g. 60"
                                        value={editMockModal.totalTime}
                                        onChange={(e) => setEditMockModal({ ...editMockModal, totalTime: +e.target.value })}
                                    />
                                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        Total time allowed for the whole mock (student timer).
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Price ₹ (0 = free)</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        value={editMockModal.price}
                                        onChange={(e) => setEditMockModal({ ...editMockModal, price: +e.target.value })}
                                    />
                                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        Rupees; <code className="rounded bg-slate-100 px-1 dark:bg-slate-700">0</code> means free.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                                <textarea
                                    className={`${fieldClass} min-h-[80px]`}
                                    placeholder="About (optional)"
                                    value={editMockModal.description}
                                    onChange={(e) => setEditMockModal({ ...editMockModal, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </Modal>
                )}

                {editQ && (
                    <Modal
                        title="Edit question"
                        wide
                        onClose={() => setEditQ(null)}
                        footer={
                            <>
                                <Button type="button" onClick={() => setEditQ(null)} className="border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await api.updateQuestion(editQ._id, {
                                                sectionName: editQ.sectionName,
                                                text: editQ.text,
                                                options: [editQ.option1, editQ.option2, editQ.option3, editQ.option4],
                                                correctOptionIndex: Number(editQ.correctOptionIndex),
                                                marks: Number(editQ.marks),
                                                negativeMarks: Number(editQ.negativeMarks),
                                            });
                                            toast.success('Updated');
                                            setEditQ(null);
                                            if (qMockId) {
                                                const d = await api.getQuestionsForMock(qMockId);
                                                setQuestionsList(d || []);
                                            }
                                        } catch (e) {
                                            toast.error(e.response?.data?.message || 'Failed');
                                        }
                                    }}
                                    className="bg-blue-600 text-white"
                                >
                                    Save
                                </Button>
                            </>
                        }
                    >
                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Section name</label>
                                <Input
                                    value={editQ.sectionName}
                                    onChange={(e) => setEditQ({ ...editQ, sectionName: e.target.value })}
                                />
                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    Must exactly match one of this mock&apos;s section names (same spelling as in Create mock / first section).
                                </p>
                            </div>
                            <textarea className={`${fieldClass} min-h-[100px]`} value={editQ.text} onChange={(e) => setEditQ({ ...editQ, text: e.target.value })} />
                            <div className="grid grid-cols-2 gap-2">
                                <Input value={editQ.option1} onChange={(e) => setEditQ({ ...editQ, option1: e.target.value })} />
                                <Input value={editQ.option2} onChange={(e) => setEditQ({ ...editQ, option2: e.target.value })} />
                                <Input value={editQ.option3} onChange={(e) => setEditQ({ ...editQ, option3: e.target.value })} />
                                <Input value={editQ.option4} onChange={(e) => setEditQ({ ...editQ, option4: e.target.value })} />
                            </div>
                            <Input
                                type="number"
                                min={0}
                                max={3}
                                value={editQ.correctOptionIndex}
                                onChange={(e) => setEditQ({ ...editQ, correctOptionIndex: +e.target.value })}
                            />
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}
