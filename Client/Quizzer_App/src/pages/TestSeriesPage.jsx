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

    const handleStartTest = (testId) => {
        navigate(`/test/${testId}/instructions`); // Go to instructions first
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <Button onClick={() => navigate('/dashboard')} className="mb-4 bg-gray-200 text-gray-700 hover:bg-gray-300">
                    &larr; Back to Dashboard
                </Button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Tests</h2>

                {loading ? (
                    <div className="text-center py-10">Loading tests...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {tests.map((test) => (
                            <div key={test._id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{test.title}</h3>
                                    <div className="text-sm text-gray-500 mt-1 space-x-4">
                                        <span>⏱ {test.totalTime} Mins</span>
                                        <span>📝 {test.sections.reduce((acc, curr) => acc + curr.totalQuestions, 0)} Questions</span>
                                        <span>💰 {test.price === 0 ? 'Free' : `₹${test.price}`}</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleStartTest(test._id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                                >
                                    Start Test
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && tests.length === 0 && (
                    <div className="text-center py-10 text-gray-500">No tests available in this category yet.</div>
                )}
            </div>
        </div>
    );
};

export default TestSeriesPage;
