import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import axios from 'axios';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('series'); // series, mock, question, leaderboard
    const [message, setMessage] = useState('');

    // Form States
    const [seriesData, setSeriesData] = useState({ name: '', description: '' });
    const [mockData, setMockData] = useState({ title: '', testSeriesId: '', totalTime: 60, price: 0, sectionName: 'General', sectionDuration: 20, sectionQCount: 10 });
    const [questionData, setQuestionData] = useState({ mockTestId: '', sectionName: '', text: '', option1: '', option2: '', option3: '', option4: '', correctOptionIndex: 0, marks: 1, negativeMarks: 0.25 });

    // Data States
    const [selectedMockDetails, setSelectedMockDetails] = useState(null);
    const [topPerformers, setTopPerformers] = useState([]);
    const [stats, setStats] = useState({ totalAttempts: 0, uniqueUsers: 0 });
    const [mockTests, setMockTests] = useState([]);

    // API Helpers
    const createSeries = async () => {
        try {
            await axios.post('https://quizz-4c67.onrender.com/api/admin/test-series', seriesData, { withCredentials: true });
            setMessage('Series Created!');
            setSeriesData({ name: '', description: '' });
        } catch (e) { setMessage('Error creating series'); }
    };

    const createMock = async () => {
        try {
            const sections = [{ name: mockData.sectionName, duration: mockData.sectionDuration, totalQuestions: mockData.sectionQCount }];
            const payload = { ...mockData, sections };
            await axios.post('https://quizz-4c67.onrender.com/api/admin/mock-test', payload, { withCredentials: true });
            setMessage('Mock Test Created!');
        } catch (e) { setMessage('Error creating mock test'); }
    };

    const fetchMockDetails = async () => {
        if (!questionData.mockTestId) return;
        try {
            const data = await api.getMockTestDetailsWithCounts(questionData.mockTestId);
            setSelectedMockDetails(data);
            setMessage('Mock Test Details Fetched');
        } catch (e) {
            setSelectedMockDetails(null);
            setMessage('Invalid Mock Test ID');
        }
    };

    const fetchTopPerformers = async () => {
        try {
            const data = await api.getTopPerformers();
            if (data.leaderboard) {
                setTopPerformers(data.leaderboard);
                setStats(data.stats);
            } else {
                setTopPerformers(data);
            }
        } catch (e) {
            console.error("Error fetching leaderboard", e);
        }
    };

    const fetchMockTests = async () => {
        try {
            const data = await api.getAllMockTests();
            setMockTests(data);
        } catch (e) { console.error("Error fetching mock tests", e); }
    };

    const generateRewards = async (mockTestId) => {
        try {
            await api.generateRewards(mockTestId, 3);
            setMessage('Rewards Generated Successfully!');
        } catch (e) { setMessage('Error generating rewards'); }
    };

    const addQuestion = async () => {
        try {
            const options = [questionData.option1, questionData.option2, questionData.option3, questionData.option4];
            const payload = { ...questionData, options };
            await axios.post('https://quizz-4c67.onrender.com/api/admin/question', payload, { withCredentials: true });
            setMessage('Question Added!');
            fetchMockDetails();
            setQuestionData({ ...questionData, text: '', option1: '', option2: '', option3: '', option4: '' });
        } catch (e) { setMessage('Error adding question'); }
    };

    // Fetch leaderboard when tab changes
    useEffect(() => {
        if (activeTab === 'leaderboard') {
            fetchTopPerformers();
        }
    }, [activeTab]);

    const tabs = ['series', 'mock', 'question', 'leaderboard', 'rewards'];

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

            {message && <div className={`p-3 rounded mb-4 ${message.includes('Error') || message.includes('Invalid') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}

            <div className="flex space-x-4 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            if (tab === 'rewards') fetchMockTests();
                        }}
                        className={`px-4 py-2 rounded capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                    >
                        {tab === 'leaderboard' ? 'Top 10 Performers' : tab === 'rewards' ? 'Manage Rewards' : `Create ${tab}`}
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded shadow-md max-w-4xl">
                {/* ... existing series, mock, question tabs ... */}
                {activeTab === 'series' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Create Test Series</h2>
                        <Input placeholder="Name (e.g. SSC)" value={seriesData.name} onChange={e => setSeriesData({ ...seriesData, name: e.target.value })} />
                        <Input placeholder="Description" value={seriesData.description} onChange={e => setSeriesData({ ...seriesData, description: e.target.value })} />
                        <Button onClick={createSeries} className="bg-blue-600 text-white w-full">Create Series</Button>
                    </div>
                )}

                {activeTab === 'mock' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Create Mock Test</h2>
                        <Input placeholder="Title" value={mockData.title} onChange={e => setMockData({ ...mockData, title: e.target.value })} />
                        <Input placeholder="Series ID (Get from DB)" value={mockData.testSeriesId} onChange={e => setMockData({ ...mockData, testSeriesId: e.target.value })} />
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Duration (in minutes)</label>
                                <Input type="number" placeholder="e.g. 60" value={mockData.totalTime} onChange={e => setMockData({ ...mockData, totalTime: +e.target.value })} />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <Input type="number" placeholder="0 for free" value={mockData.price} onChange={e => setMockData({ ...mockData, price: +e.target.value })} />
                            </div>
                        </div>
                        <h3 className="font-medium pt-2 border-t">First Section Details</h3>
                        <Input placeholder="Section Name" value={mockData.sectionName} onChange={e => setMockData({ ...mockData, sectionName: e.target.value })} />
                        <div className="flex gap-4">
                            <Input type="number" placeholder="Duration (min)" value={mockData.sectionDuration} onChange={e => setMockData({ ...mockData, sectionDuration: +e.target.value })} />
                            <Input type="number" placeholder="Total Questions Expected" value={mockData.sectionQCount} onChange={e => setMockData({ ...mockData, sectionQCount: +e.target.value })} />
                        </div>
                        <Button onClick={createMock} className="bg-blue-600 text-white w-full">Create Mock Test</Button>
                    </div>
                )}

                {activeTab === 'question' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Add Question</h2>

                        <div className="flex gap-2 items-end">
                            <div className="flex-grow">
                                <Input placeholder="Enter Mock Test ID" value={questionData.mockTestId} onChange={e => setQuestionData({ ...questionData, mockTestId: e.target.value })} />
                            </div>
                            <Button onClick={fetchMockDetails} className="bg-gray-800 text-white h-10 mb-1">Fetch Details</Button>
                        </div>

                        {selectedMockDetails && (
                            <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 border border-blue-200">
                                <p className="font-bold">{selectedMockDetails.title}</p>
                                <div className="mt-2 space-y-1">
                                    {selectedMockDetails.sections.map(sec => (
                                        <div key={sec.name} className="flex justify-between">
                                            <span>{sec.name}</span>
                                            <span className={sec.addedQuestions >= sec.totalQuestions ? "text-green-600 font-bold" : "text-orange-600"}>
                                                {sec.addedQuestions} / {sec.totalQuestions} Questions Added
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                {selectedMockDetails ? (
                                    <select
                                        className="w-full border rounded p-2"
                                        value={questionData.sectionName}
                                        onChange={e => setQuestionData({ ...questionData, sectionName: e.target.value })}
                                    >
                                        <option value="">Select Section</option>
                                        {selectedMockDetails.sections.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                    </select>
                                ) : (
                                    <Input placeholder="Section Name" value={questionData.sectionName} onChange={e => setQuestionData({ ...questionData, sectionName: e.target.value })} />
                                )}
                            </div>
                        </div>

                        <textarea
                            placeholder="Question Text"
                            className="w-full border rounded p-2 min-h-[100px]"
                            value={questionData.text}
                            onChange={e => setQuestionData({ ...questionData, text: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="Option 1" value={questionData.option1} onChange={e => setQuestionData({ ...questionData, option1: e.target.value })} />
                            <Input placeholder="Option 2" value={questionData.option2} onChange={e => setQuestionData({ ...questionData, option2: e.target.value })} />
                            <Input placeholder="Option 3" value={questionData.option3} onChange={e => setQuestionData({ ...questionData, option3: e.target.value })} />
                            <Input placeholder="Option 4" value={questionData.option4} onChange={e => setQuestionData({ ...questionData, option4: e.target.value })} />
                        </div>
                        <label className="block text-sm font-medium">Correct Option Index (0-3)</label>
                        <Input type="number" min="0" max="3" value={questionData.correctOptionIndex} onChange={e => setQuestionData({ ...questionData, correctOptionIndex: +e.target.value })} />
                        <Button onClick={addQuestion} className="bg-blue-600 text-white w-full">Add Question</Button>
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-indigo-50 p-4 rounded-lg text-center border border-indigo-100">
                                <h3 className="text-2xl font-bold text-indigo-600">{stats.uniqueUsers}</h3>
                                <p className="text-sm text-gray-500">Total Users Attempted</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100">
                                <h3 className="text-2xl font-bold text-purple-600">{stats.totalAttempts}</h3>
                                <p className="text-sm text-gray-500">Total Tests Taken</p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-3">🏆 Top 10 Performers</h2>
                            {topPerformers.length === 0 ? (
                                <p className="text-gray-500">No results found yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {topPerformers.map((result, index) => (
                                                <tr key={result._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{result.userId?.fullname?.firstName} {result.userId?.fullname?.lastName}</div>
                                                        <div className="text-sm text-gray-500">{result.userId?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {result.mockTestId?.title || 'Unknown Test'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                        {result.score}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(result.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Reward Management</h2>
                        <div className="bg-orange-50 p-4 border border-orange-200 rounded text-sm text-orange-800">
                            Note: Generation creates rewards for top 3 rankers of selected test.
                        </div>
                        <div className="divide-y">
                            {mockTests.map(test => (
                                <div key={test._id} className="py-4 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold">{test.title}</div>
                                        <div className="text-xs text-gray-500">ID: {test._id}</div>
                                    </div>
                                    <Button onClick={() => generateRewards(test._id)} className="bg-indigo-600 text-white py-1">
                                        Generate Rewards
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
