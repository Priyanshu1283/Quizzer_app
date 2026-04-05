import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRazorpayCheckout } from '../hooks/useRazorpayCheckout';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';

const TestInstructionsPage = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { startCheckout, payingId, message: paymentMessage, setMessage: setPaymentMessage } =
        useRazorpayCheckout(user);

    const [testDetails, setTestDetails] = useState(null);
    const [purchasedIds, setPurchasedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [startError, setStartError] = useState(null);

    const refreshPurchases = useCallback(async () => {
        try {
            const data = await api.getMyPurchases();
            setPurchasedIds(new Set(data.mockTestIds || []));
        } catch {
            setPurchasedIds(new Set());
        }
    }, []);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await api.getTestDetails(testId);
                setTestDetails(data);
            } catch (error) {
                console.error('Failed to load test details', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
        refreshPurchases();
    }, [testId, refreshPurchases]);

    const isPaid = testDetails && Number(testDetails.price) > 0;
    const hasAccess = testDetails && (!isPaid || purchasedIds.has(testDetails._id));

    const handleBuy = () => {
        if (!testDetails) return;
        setPaymentMessage(null);
        startCheckout(testDetails, { onVerified: refreshPurchases });
    };

    const handleProceed = async () => {
        setStartError(null);
        try {
            const { attempt } = await api.startAttempt(testId);
            navigate(`/test/${testId}/attempt/${attempt._id}`);
        } catch (error) {
            console.error('Failed to start attempt', error);
            if (error.response?.status === 402 || error.response?.data?.code === 'PAYMENT_REQUIRED') {
                setStartError('You need to purchase this test before you can begin.');
                await refreshPurchases();
            } else {
                setStartError(error.response?.data?.message || 'Failed to start test. Please try again.');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-400" />
                    <p className="text-sm text-gray-500 dark:text-slate-400">Loading instructions...</p>
                </div>
            </div>
        );
    }

    if (!testDetails) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center text-gray-500 dark:text-slate-400">
                    <div className="mb-4 text-5xl">😕</div>
                    <p className="font-medium">Test not found.</p>
                    <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const totalQuestions = testDetails.sections.reduce((acc, s) => acc + s.totalQuestions, 0);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <nav className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 sm:gap-4 sm:px-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-slate-400 dark:hover:text-white"
                >
                    ← Back
                </button>
                <div className="h-5 w-px bg-gray-200 dark:bg-slate-600" />
                <span className="flex-1 truncate font-bold text-gray-800 dark:text-slate-100">{testDetails.title}</span>
                <ThemeToggle nav={false} />
            </nav>

            <div className="flex flex-1 items-start justify-center px-4 py-10">
                <div className="animate-in w-full max-w-2xl">
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

                    {isPaid && !hasAccess && (
                        <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-orange-950/30">
                            <div className="border-b border-amber-100 px-5 py-4 dark:border-amber-900/40">
                                <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                                    Paid test
                                </p>
                                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                                    Unlock for ₹{Number(testDetails.price).toFixed(0)}
                                </p>
                                <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">
                                    Pay once with Razorpay to access this mock. Your purchase is tied to your account.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-slate-600 dark:text-slate-400">Secure UPI, cards &amp; wallets.</p>
                                <Button
                                    onClick={handleBuy}
                                    disabled={payingId === testDetails._id}
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md hover:from-amber-600 hover:to-orange-700 disabled:opacity-60"
                                >
                                    {payingId === testDetails._id ? 'Opening checkout…' : `Pay ₹${Number(testDetails.price).toFixed(0)}`}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="border-b border-gray-100 p-6" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)' }}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <h1 className="text-2xl font-black text-white">{testDetails.title}</h1>
                                {!isPaid ? (
                                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">Free</span>
                                ) : hasAccess ? (
                                    <span className="rounded-full bg-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-50 ring-1 ring-emerald-300/40">
                                        Unlocked
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-amber-400/25 px-3 py-1 text-xs font-bold text-amber-50 ring-1 ring-amber-200/40">
                                        ₹{Number(testDetails.price).toFixed(0)}
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-5">
                                <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                                        <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    {testDetails.totalTime} minutes total
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    {totalQuestions} questions
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    {testDetails.sections.length} section{testDetails.sections.length > 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50 dark:divide-slate-800">
                            {testDetails.sections.map((sec, idx) => (
                                <div key={idx} className="flex items-center justify-between px-6 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                                            {idx + 1}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{sec.name}</span>
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-500 dark:text-slate-400">
                                        <span>{sec.totalQuestions} Qs</span>
                                        <span>·</span>
                                        <span>{sec.duration} min</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-800 dark:text-slate-100">
                            <span className="text-yellow-500">📋</span> Instructions
                        </h2>
                        <ul className="space-y-3">
                            {[
                                'The exam timer starts immediately when you click "Begin Test".',
                                'Each question has its own timer and auto-submits on expiry.',
                                'You cannot go back to previous questions once you move forward.',
                                'Wrong answers carry negative marking. Use the marks scheme shown on each question.',
                                'Once the overall time is up, the test is submitted automatically.',
                                'Avoid refreshing or closing the browser tab during the test.',
                            ].map((txt, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-400">
                                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                                        {i + 1}
                                    </span>
                                    {txt}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {startError && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                            {startError}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            onClick={() => navigate(-1)}
                            className="border border-gray-200 bg-white px-6 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </Button>
                        {hasAccess ? (
                            <Button
                                onClick={handleProceed}
                                className="bg-blue-600 px-10 py-3 text-base font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:shadow-blue-900/40 dark:hover:bg-blue-600"
                            >
                                🚀 Begin test
                            </Button>
                        ) : (
                            <Button
                                onClick={handleBuy}
                                disabled={payingId === testDetails._id}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 px-10 py-3 text-base font-bold text-white shadow-lg hover:from-amber-600 hover:to-orange-700 disabled:opacity-60"
                            >
                                {payingId === testDetails._id ? 'Opening checkout…' : `Pay ₹${Number(testDetails.price).toFixed(0)} to begin`}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestInstructionsPage;
