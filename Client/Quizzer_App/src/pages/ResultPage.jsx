import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Button from '../components/Button';

const ResultPage = () => {
    const { resultId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const data = await api.getResult(resultId);
                setResult(data);
            } catch (error) {
                console.error("Failed to load result", error);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [resultId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Loading your result...</p>
            </div>
        </div>
    );

    if (!result) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center text-gray-500">
                <div className="text-5xl mb-4">😕</div>
                <p className="font-medium">Result not found.</p>
                <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">Back to Dashboard</Button>
            </div>
        </div>
    );

    const totalQs = (result.totalCorrect || 0) + (result.totalWrong || 0) + (result.totalUnattempted || 0);
    const accuracy = totalQs > 0 ? Math.round(((result.totalCorrect || 0) / totalQs) * 100) : 0;
    const scorePercent = Math.min(100, Math.round(((result.score || 0) / ((result.totalCorrect || 1) * 4)) * 100));

    const statCards = [
        { label: 'Total Score', value: result.score, color: 'blue', icon: '🎯' },
        { label: 'Correct', value: result.totalCorrect, color: 'green', icon: '✅' },
        { label: 'Wrong', value: result.totalWrong, color: 'red', icon: '❌' },
        { label: 'Unattempted', value: result.totalUnattempted || 0, color: 'gray', icon: '⭕' },
    ];

    const colorMap = {
        blue: 'bg-blue-50 border-blue-100 text-blue-700',
        green: 'bg-green-50 border-green-100 text-green-700',
        red: 'bg-red-50 border-red-100 text-red-700',
        gray: 'bg-gray-50 border-gray-200 text-gray-600',
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="h-16 px-6 flex items-center gap-3 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">Q</div>
                <span className="font-bold text-gray-800">Test Result</span>
            </nav>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in">

                {/* Hero Banner */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)' }}>
                    <div className="p-8 text-center text-white">
                        <div className="text-5xl mb-3">🎉</div>
                        <h1 className="text-3xl font-black mb-1">Test Completed!</h1>
                        <p className="text-blue-200 text-sm">{result.mockTestId?.title || 'Mock Test'}</p>

                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {statCards.map(({ label, value, icon }) => (
                                <div key={label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                    <div className="text-2xl mb-1">{icon}</div>
                                    <div className="text-3xl font-black text-white">{value ?? 0}</div>
                                    <div className="text-blue-200 text-xs mt-1 font-medium">{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Accuracy bar */}
                        <div className="mt-6 max-w-xs mx-auto">
                            <div className="flex items-center justify-between text-xs text-blue-200 mb-1.5">
                                <span>Accuracy</span>
                                <span className="font-bold text-white">{accuracy}%</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${accuracy}%`, background: accuracy >= 70 ? '#4ade80' : accuracy >= 40 ? '#fbbf24' : '#f87171' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Analysis */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-800">📊 Section-wise Performance</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <th className="px-6 py-3">Section</th>
                                    <th className="px-6 py-3 text-blue-600">Score</th>
                                    <th className="px-6 py-3 text-green-600">Correct</th>
                                    <th className="px-6 py-3 text-red-500">Wrong</th>
                                    <th className="px-6 py-3 text-gray-400">Skipped</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {Object.entries(result.sectionAnalysis || {}).map(([name, stats]) => (
                                    <tr key={name} className="hover:bg-gray-50/70 transition">
                                        <td className="px-6 py-4 font-semibold text-gray-800 text-sm">{name}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-sm font-bold px-2.5 py-1 rounded-lg">{stats.score}</span>
                                        </td>
                                        <td className="px-6 py-4 text-green-600 font-semibold text-sm">{stats.correct}</td>
                                        <td className="px-6 py-4 text-red-500 font-semibold text-sm">{stats.wrong}</td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">{stats.unattempted}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Feedback */}
                <div className={`rounded-2xl border p-5 ${accuracy >= 70 ? 'bg-green-50 border-green-100' : accuracy >= 40 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'}`}>
                    <p className={`font-semibold text-sm ${accuracy >= 70 ? 'text-green-700' : accuracy >= 40 ? 'text-yellow-700' : 'text-red-700'}`}>
                        {accuracy >= 70 ? '🌟 Excellent performance! Keep it up!' : accuracy >= 40 ? '💪 Good effort! Focus on accuracy.' : '📚 Keep practicing! Consistency is key.'}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pb-4">
                    <Button
                        onClick={() => navigate('/dashboard')}
                        className="bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 px-10 py-3 text-base font-bold"
                    >
                        ← Back to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ResultPage;
