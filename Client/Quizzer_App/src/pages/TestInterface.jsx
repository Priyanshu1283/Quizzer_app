import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Button from '../components/Button';
import Timer from '../components/Timer';

const TestInterface = () => {
    const { testId, attemptId } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState({}); // { questionId: selectedOptionIndex }
    const [loading, setLoading] = useState(true);
    const [sectionTimeLeft, setSectionTimeLeft] = useState(0);

    // Fetch Test Data
    useEffect(() => {
        const fetchTest = async () => {
            try {
                const data = await api.startTest(testId);
                setTest(data.test);
                setQuestions(data.questions);

                // Initialize section time (first section)
                if (data.test.sections.length > 0) {
                    setSectionTimeLeft(data.test.sections[0].duration * 60);
                }
            } catch (error) {
                console.error("Failed to load test", error);
                alert("Error loading test.");
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [testId]);

    // Handle Section Auto-Submit
    const handleSectionTimeUp = () => {
        alert("Section Time Up! Moving to next section.");
        submitCurrentSection(true);
    };

    const submitCurrentSection = async (autoMove = false) => {
        // Prepare responses for this section
        const currentSectionName = test.sections[currentSectionIndex].name;
        const sectionQuestions = questions.filter(q => q.sectionName === currentSectionName);

        const sectionResponses = sectionQuestions.map(q => ({
            questionId: q._id,
            selectedOptionIndex: responses[q._id],
            timeTaken: 0 // TODO: Track time per question
        })).filter(r => r.selectedOptionIndex !== undefined);

        try {
            await api.submitSection(attemptId, sectionResponses);

            if (autoMove || currentSectionIndex < test.sections.length - 1) {
                if (currentSectionIndex < test.sections.length - 1) {
                    setCurrentSectionIndex(prev => {
                        const newIndex = prev + 1;
                        setSectionTimeLeft(test.sections[newIndex].duration * 60);
                        setCurrentQuestionIndex(0); // Reset question index for new section? Or keep global? Usually section-wise restart.
                        return newIndex;
                    });
                } else {
                    // Last section finished
                    handleSubmitTest();
                }
            }
        } catch (error) {
            console.error("Error submitting section", error);
        }
    };

    const handleSubmitTest = async () => {
        const confirmSubmit = window.confirm("Are you sure you want to submit the test?");
        if (!confirmSubmit) return;

        // Submit last section data first ensuring latest state
        // (Simplified here: we assume handleSectionTimeUp or manual section switch handles intermediate saves)
        // Ideally we should sync pending responses.

        // Just calling final submit, backend should calculate based on stored attempts.
        // But we need to make sure latest 'responses' state is pushed.
        // Let's do a final section push just in case.
        const currentSectionName = test.sections[currentSectionIndex].name;
        const sectionQuestions = questions.filter(q => q.sectionName === currentSectionName);
        const sectionResponses = sectionQuestions.map(q => ({
            questionId: q._id,
            selectedOptionIndex: responses[q._id]
        })).filter(r => r.selectedOptionIndex !== undefined);

        try {
            await api.submitSection(attemptId, sectionResponses); // Final sync
            const resultData = await api.submitTest(attemptId);
            navigate(`/result/${resultData.result._id}`);
        } catch (error) {
            console.error("Error submitting test", error);
        }
    };

    const handleOptionSelect = (questionId, optionIndex) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    if (loading) return <div className="flex items-center justify-center h-screen">Loading Test...</div>;

    // Derived state for rendering
    const currentSection = test.sections[currentSectionIndex];
    const currentSectionQuestions = questions.filter(q => q.sectionName === currentSection.name);
    const activeQuestion = currentSectionQuestions[currentQuestionIndex];

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-800">{test.title}</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-600">Section: {currentSection.name}</span>
                    <div className="bg-gray-600 text-white px-4 py-2 rounded-md">
                        <Timer
                            durationInSeconds={sectionTimeLeft}
                            onTimeUp={handleSectionTimeUp}
                        />
                    </div>
                    <Button onClick={handleSubmitTest} className="bg-red-600 hover:bg-red-800 text-white">Submit Test</Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content (Question Area) */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-sm p-8 min-h-[400px]">
                        <div className="mb-4 text-sm text-gray-500 flex justify-between">
                            <span>Question {currentQuestionIndex + 1} of {currentSectionQuestions.length}</span>
                            <span>Marks: +{activeQuestion?.marks}, -{activeQuestion?.negativeMarks}</span>
                        </div>

                        <div className="text-xl font-medium text-gray-900 mb-8">
                            {activeQuestion?.text}
                        </div>

                        <div className="space-y-3">
                            {activeQuestion?.options.map((option, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleOptionSelect(activeQuestion._id, idx)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${responses[activeQuestion._id] === idx
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${responses[activeQuestion._id] === idx ? 'border-blue-500' : 'border-gray-300'
                                            }`}>
                                            {responses[activeQuestion._id] === idx && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                                        </div>
                                        <span className="text-gray-700">{option}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-between">
                            <Button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                            >
                                Previous
                            </Button>

                            <div className="space-x-2">
                                <Button
                                    onClick={() => setResponses(prev => {
                                        const newResp = { ...prev };
                                        delete newResp[activeQuestion._id];
                                        return newResp;
                                    })}
                                    className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                >
                                    Clear Response
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (currentQuestionIndex < currentSectionQuestions.length - 1) {
                                            setCurrentQuestionIndex(prev => prev + 1);
                                        } else {
                                            // Handle End of Section Logic if manual
                                            submitCurrentSection();
                                        }
                                    }}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    {currentQuestionIndex === currentSectionQuestions.length - 1 ? 'Save & Next Section' : 'Save & Next'}
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Sidebar (Question Palette) */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 font-semibold bg-gray-50">
                        Question Palette
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-4 gap-2">
                            {currentSectionQuestions.map((q, idx) => (
                                <button
                                    key={q._id}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${currentQuestionIndex === idx
                                        ? 'ring-2 ring-offset-1 ring-blue-500 bg-blue-100 text-blue-700'
                                        : responses[q._id] !== undefined
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 space-y-2">
                        <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-2" /> Answered</div>
                        <div className="flex items-center"><div className="w-3 h-3 bg-gray-100 rounded mr-2" /> Not Answered</div>
                        <div className="flex items-center"><div className="w-3 h-3 bg-blue-100 ring-2 ring-blue-500 rounded mr-2" /> Current</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestInterface;
