import axios from 'axios';

const API_URL = 'https://quizz-4c67.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export const getTestSeries = async () => {
    const response = await api.get('/admin/test-series'); // Or /test/series if public
    return response.data;
};

export const getMockTests = async (seriesId) => {
    const response = await api.get(`/test/series/${seriesId}/tests`);
    return response.data;
};

export const getAllMockTests = async () => {
    const response = await api.get('/admin/mock-tests');
    return response.data;
};


export const getTestDetails = async (testId) => {
    const response = await api.get(`/test/tests/${testId}`);
    return response.data;
};

export const startTest = async (testId) => {
    const response = await api.get(`/test/tests/${testId}/start`);
    return response.data;
};

export const startAttempt = async (mockTestId) => {
    const response = await api.post('/attempt/start', { mockTestId });
    return response.data;
};

export const submitSection = async (attemptId, responses) => {
    const response = await api.post('/attempt/submit-section', { attemptId, responses });
    return response.data;
};

export const submitTest = async (attemptId) => {
    const response = await api.post('/attempt/submit', { attemptId });
    return response.data;
};

export const getResult = async (resultId) => {
    const response = await api.get(`/attempt/result/${resultId}`);
    return response.data;
};

export const getMockTestDetailsWithCounts = async (mockTestId) => {
    const response = await api.get(`/admin/mock-test/${mockTestId}`);
    return response.data;
};

export const getTopPerformers = async () => {
    const response = await api.get('/admin/top-performers');
    return response.data;
};

// Reward APIs
export const getMyRewards = async () => {
    const response = await api.get('/reward/my-rewards');
    return response.data;
}

export const claimReward = async (rewardId) => {
    const response = await api.post(`/reward/claim/${rewardId}`);
    return response.data;
}

export const generateRewards = async (mockTestId, prizeCount) => {
    const response = await api.post('/reward/generate', { mockTestId, prizeCount });
    return response.data;
}

export const distributeReward = async (rewardId) => {
    const response = await api.post(`/reward/distribute/${rewardId}`);
    return response.data;
}

export default api;