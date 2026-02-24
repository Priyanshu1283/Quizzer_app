import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Button from '../components/Button';

const TestSeriesPage = () => {
    const { seriesId } = useParams();
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const data = await api.getMockTests(seriesId);
                setTests(data);
            } catch (error) {
                console.error("Failed to fetch mock tests", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, [seriesId]);

    return (
        <div className="min-h-screen" style={{ background: '#f8faff' }}>
            {/* Header */}
            <nav style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)' }} className="sticky top-0 z-30 px-6 h-16 flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition"
                >
                    ← Dashboard
                </button>
                <div className="w-px h-5 bg-white/20" />
                <span className="text-white font-bold">Available Tests</span>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-8 animate-in">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
                    </div>
                ) : tests.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <div className="text-5xl mb-4">📝</div>
                        <p className="font-medium text-lg">No tests available yet</p>
                        <p className="text-sm mt-1">Check back soon!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tests.map((test) => {
                            const totalQ = test.sections.reduce((acc, s) => acc + s.totalQuestions, 0);
                            return (
                                <div key={test._id}
                                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                                    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {test.price === 0
                                                    ? <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">FREE</span>
                                                    : <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">₹{test.price}</span>
                                                }
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">{test.title}</h3>
                                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5" /><path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                                    {test.totalTime} minutes
                                                </span>
                                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                                    {totalQ} questions
                                                </span>
                                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                                    {test.sections.length} section{test.sections.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => navigate(`/test/${test._id}/instructions`)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 px-8 py-3 text-sm whitespace-nowrap"
                                        >
                                            Start Test →
                                        </Button>
                                    </div>
                                    {/* Section pills */}
                                    <div className="px-6 pb-5 flex flex-wrap gap-2">
                                        {test.sections.map((sec, i) => (
                                            <span key={i} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full font-medium">
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
