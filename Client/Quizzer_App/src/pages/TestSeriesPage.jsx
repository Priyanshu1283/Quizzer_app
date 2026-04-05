import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRazorpayCheckout } from '../hooks/useRazorpayCheckout';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';

const TestSeriesPage = () => {
    const { seriesId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { startCheckout, payingId, message: paymentMessage, setMessage: setPaymentMessage } =
        useRazorpayCheckout(user);
    const [tests, setTests] = useState([]);
    const [purchasedIds, setPurchasedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);

    const refreshPurchases = useCallback(async () => {
        try {
            const data = await api.getMyPurchases();
            setPurchasedIds(new Set(data.mockTestIds || []));
        } catch {
            setPurchasedIds(new Set());
        }
    }, []);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const data = await api.getMockTests(seriesId);
                setTests(data);
            } catch (error) {
                console.error('Failed to fetch mock tests', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
        refreshPurchases();
    }, [seriesId, refreshPurchases]);

    const isPaid = (test) => Number(test.price) > 0;
    const hasAccess = (test) => !isPaid(test) || purchasedIds.has(test._id);

    const handleBuy = (test) => {
        setPaymentMessage(null);
        startCheckout(test, { onVerified: refreshPurchases });
    };

    return (
        <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
            <nav className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-gradient-to-r from-blue-700 to-indigo-600 px-4 shadow-lg shadow-blue-900/10 sm:gap-4 sm:px-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-sm font-medium text-white/85 transition hover:text-white"
                >
                    ← Dashboard
                </button>
                <div className="h-5 w-px bg-white/20" />
                <span className="flex-1 font-bold text-white">Available tests</span>
                <ThemeToggle />
            </nav>

            <div className="mx-auto max-w-4xl animate-in px-4 py-8 sm:px-6">
                {paymentMessage && (
                    <div
                        className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                            paymentMessage.includes('successful')
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100'
                                : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100'
                        }`}
                    >
                        {paymentMessage}
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-slate-700" />
                        ))}
                    </div>
                ) : tests.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 dark:text-slate-500">
                        <div className="mb-4 text-5xl">📝</div>
                        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No tests available yet</p>
                        <p className="mt-1 text-sm">Check back soon!</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {tests.map((test) => {
                            const totalQ = test.sections.reduce((acc, s) => acc + s.totalQuestions, 0);
                            const paid = isPaid(test);
                            const access = hasAccess(test);

                            return (
                                <div
                                    key={test._id}
                                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-slate-900 dark:shadow-none dark:hover:shadow-slate-900/50 ${
                                        paid
                                            ? 'border-amber-200/80 ring-1 ring-amber-100/50 dark:border-amber-900/50 dark:ring-amber-900/20'
                                            : 'border-gray-100 dark:border-slate-700'
                                    }`}
                                >
                                    <div
                                        className={`h-1 w-full ${
                                            paid
                                                ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400'
                                                : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                        }`}
                                    />
                                    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex-1">
                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                {paid ? (
                                                    <>
                                                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950/80 dark:text-amber-200">
                                                            Paid · ₹{Number(test.price).toFixed(0)}
                                                        </span>
                                                        {access && (
                                                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                                                                Unlocked
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                                                        Free
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{test.title}</h3>
                                            <div className="mt-2 flex flex-wrap items-center gap-4">
                                                <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                                                    <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                                                        <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" />
                                                    </svg>
                                                    {test.totalTime} minutes
                                                </span>
                                                <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                                                    <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path
                                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    {totalQ} questions
                                                </span>
                                                <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                                                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path
                                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    {test.sections.length} section{test.sections.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 sm:items-end">
                                            {access ? (
                                                <Button
                                                    onClick={() => navigate(`/test/${test._id}/instructions`)}
                                                    className="whitespace-nowrap bg-blue-600 px-8 py-3 text-sm text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                                >
                                                    Start test →
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => handleBuy(test)}
                                                    disabled={payingId === test._id}
                                                    className="whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-md hover:from-amber-600 hover:to-orange-700 disabled:opacity-60"
                                                >
                                                    {payingId === test._id ? 'Opening checkout…' : `Buy · ₹${Number(test.price).toFixed(0)}`}
                                                </Button>
                                            )}
                                            {!access && (
                                                <p className="max-w-xs text-right text-xs text-slate-500 dark:text-slate-400">
                                                    Secure payment via Razorpay. Lifetime access to this mock.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 px-6 pb-5">
                                        {test.sections.map((sec, i) => (
                                            <span
                                                key={i}
                                                className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-300"
                                            >
                                                {sec.name} · {sec.duration}m
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestSeriesPage;
