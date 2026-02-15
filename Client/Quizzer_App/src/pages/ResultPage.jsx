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

    if (loading) return <div className="p-10 text-center">Loading Result...</div>;
    if (!result) return <div className="p-10 text-center">Result not found.</div>;

    // Helper to render section row
    const renderSectionRow = (name, stats) => (
        <tr key={name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <td className="py-3 px-4 font-medium text-gray-700">{name}</td>
            <td className="py-3 px-4 text-green-600 font-semibold">{stats.score}</td>
            <td className="py-3 px-4 text-blue-600">{stats.correct}</td>
            <td className="py-3 px-4 text-red-500">{stats.wrong}</td>
            <td className="py-3 px-4 text-gray-500">{stats.unattempted}</td>
        </tr>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
            <div className="max-w-4xl w-full space-y-6">

                {/* Header Card */}
                <div className="bg-white rounded-xl shadow-lg p-8 text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <h2 className="text-3xl font-bold mb-2">Test Completed!</h2>
                    <p className="opacity-90">{result.mockTestId?.title || 'Mock Test'}</p>

                    <div className="mt-8 flex justify-center gap-12">
                        <div>
                            <div className="text-4xl font-bold">{result.score}</div>
                            <div className="text-sm opacity-80 mt-1">Total Score</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold">{result.totalCorrect}</div>
                            <div className="text-sm opacity-80 mt-1">Correct</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold">{result.totalWrong}</div>
                            <div className="text-sm opacity-80 mt-1">Wrong</div>
                        </div>
                    </div>
                </div>

                {/* Section Analysis */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Section-wise Performance</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                                    <th className="py-3 px-4 rounded-l-lg">Section</th>
                                    <th className="py-3 px-4">Score</th>
                                    <th className="py-3 px-4">Correct</th>
                                    <th className="py-3 px-4">Wrong</th>
                                    <th className="py-3 px-4 rounded-r-lg">Unattempted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(result.sectionAnalysis || {}).map(([name, stats]) =>
                                    renderSectionRow(name, stats)
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center pt-4">
                    <Button
                        onClick={() => navigate('/dashboard')}
                        className="bg-gray-800 text-white hover:bg-gray-900 px-8 py-3 rounded-lg shadow-md transition transform hover:-translate-y-1"
                    >
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ResultPage;
