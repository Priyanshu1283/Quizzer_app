import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const TestInstructionsPage = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
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
        // Here we could create the attempt on the backend immediately, 
        // or wait until the actual test interface loads. 
        // Let's create it here to get an attemptId.
        try {
            const { attempt } = await api.startAttempt(user._id, testId);
            // Navigate to actual test interface with attemptId
            // We pass attemptId strictly via state or URL? 
            // URL specific to attempt is safer for refresh: /test/:testId/attempt/:attemptId
            navigate(`/test/${testId}/attempt/${attempt._id}`);
        } catch (error) {
            console.error("Failed to start attempt", error);
            alert("Failed to start test. Please try again.");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading instructions...</div>;
    if (!testDetails) return <div className="p-10 text-center">Test not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
            <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{testDetails.title}</h1>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                    <p className="font-semibold text-blue-700">Read the instructions carefully before starting.</p>
                </div>

                <div className="space-y-4 text-gray-700 mb-8">
                    <p><strong>Total Time:</strong> {testDetails.totalTime} Minutes</p>
                    <p><strong>Total Sections:</strong> {testDetails.sections.length}</p>

                    <h3 className="font-semibold text-lg mt-4">Section Details:</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        {testDetails.sections.map((sec, idx) => (
                            <li key={idx}>
                                <strong>{sec.name}:</strong> {sec.totalQuestions} Questions - {sec.duration} Minutes
                            </li>
                        ))}
                    </ul>

                    <h3 className="font-semibold text-lg mt-4">General Instructions:</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>The clock will be set at the server.</li>
                        <li>The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.</li>
                        <li>When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
                        <li>There is distinct sectional timing. You will be automatically moved to the next section when the current section time expires.</li>
                    </ul>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-100">
                    <Button onClick={() => navigate(-1)} className="mr-4 bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</Button>
                    <Button onClick={handleProceed} className="bg-blue-600 text-white hover:bg-blue-700 px-8">I am ready to begin</Button>
                </div>
            </div>
        </div>
    );
};

export default TestInstructionsPage;
