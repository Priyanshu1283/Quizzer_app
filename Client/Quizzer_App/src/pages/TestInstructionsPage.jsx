import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Button from '../components/Button';

const TestInstructionsPage = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [testDetails, setTestDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await api.getTestDetails(testId);
                setTestDetails(data);
            } catch (error) {
                console.error("Failed to load test details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [testId]);

    const handleProceed = async () => {
        try {
            const { attempt } = await api.startAttempt(testId);
            navigate(`/test/${testId}/attempt/${attempt._id}`);
        } catch (error) {
            console.error("Failed to start attempt", error);
            alert("Failed to start test. Please try again.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Loading instructions...</p>
            </div>
        </div>
    );

    if (!testDetails) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center text-gray-500">
                <div className="text-5xl mb-4">😕</div>
                <p className="font-medium">Test not found.</p>
                <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">Back to Dashboard</Button>
            </div>
        </div>
    );

    const totalQuestions = testDetails.sections.reduce((acc, s) => acc + s.totalQuestions, 0);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <nav className="sticky top-0 z-30 h-16 px-6 flex items-center gap-4 border-b border-gray-200 bg-white">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition">
                    ← Back
                </button>
                <div className="w-px h-5 bg-gray-200" />
                <span className="font-bold text-gray-800 truncate">{testDetails.title}</span>
            </nav>

            <div className="flex-1 flex items-start justify-center px-4 py-10">
                <div className="w-full max-w-2xl animate-in">

                    {/* Test Overview Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)' }}>
                            <h1 className="text-2xl font-black text-white">{testDetails.title}</h1>
                            <div className="flex flex-wrap gap-5 mt-4">
                                <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5" /><path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                    {testDetails.totalTime} minutes total
                                </div>
                                <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                    {totalQuestions} questions
                                </div>
                                <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                    {testDetails.sections.length} section{testDetails.sections.length > 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        {/* Sections */}
                        <div className="divide-y divide-gray-50">
                            {testDetails.sections.map((sec, idx) => (
                                <div key={idx} className="flex items-center justify-between px-6 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                                        <span className="font-semibold text-gray-800 text-sm">{sec.name}</span>
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-500">
                                        <span>{sec.totalQuestions} Qs</span>
                                        <span>·</span>
                                        <span>{sec.duration} min</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-yellow-500">📋</span> Instructions
                        </h2>
                        <ul className="space-y-3">
                            {[
                                'The timer starts immediately when you click "Begin Test".',
                                'Each section has a separate time limit. You will be automatically moved to the next section when time expires.',
                                'You can navigate between questions freely within a section.',
                                'Wrong answers carry negative marking. Use the marks scheme shown on each question.',
                                'Once the overall time is up, the test is submitted automatically.',
                                'Avoid refreshing or closing the browser tab during the test.',
                            ].map((txt, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                                    {txt}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between gap-4">
                        <Button onClick={() => navigate(-1)} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6">
                            Cancel
                        </Button>
                        <Button onClick={handleProceed} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 text-base font-bold focus:ring-blue-500 shadow-lg shadow-blue-200">
                            🚀 Begin Test
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestInstructionsPage;
