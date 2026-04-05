import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export const getTestSeries = async () => {
    const response = await api.get('/test/series');
    return response.data;
};

export const getMocksCatalog = async () => {
    const response = await api.get('/test/mocks-catalog');
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

export const getAllMockTestsForAdmin = async (search = '', seriesId = '') => {
    const params = {};
    if (search) params.q = search;
    if (seriesId) params.seriesId = seriesId;
    const response = await api.get('/admin/mock-tests', {
        params: Object.keys(params).length ? params : undefined,
    });
    return response.data;
};

export const getAdminTestSeries = async () => {
    const response = await api.get('/admin/test-series');
    return response.data;
};

export const getAdminUsersStats = async () => {
    const response = await api.get('/admin/users-stats');
    return response.data;
};

export const getQuestionsForMock = async (mockTestId) => {
    const response = await api.get(`/admin/mock-test/${mockTestId}/questions`);
    return response.data;
};

export const updateQuestion = async (questionId, payload) => {
    const response = await api.put(`/admin/question/${questionId}`, payload);
    return response.data;
};

export const getAdminTopPerformers = async () => {
    const response = await api.get('/admin/top-performers');
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

export const getAttemptState = async (attemptId) => {
    const response = await api.get(`/attempt/${attemptId}`);
    return response.data;
};

export const submitAnswer = async (attemptId, questionId, selectedOptionIndex, timeSpentSeconds) => {
    const response = await api.post('/attempt/answer', {
        attemptId,
        questionId,
        selectedOptionIndex,
        timeSpentSeconds
    });
    return response.data;
};

export const recordAttemptWarning = async (attemptId, reason) => {
    const response = await api.post('/attempt/warn', { attemptId, reason });
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
    const response = await api.get('/test/leaderboard');
    return response.data;
};

export const createTestSeries = async (payload) => {
    const response = await api.post('/admin/test-series', payload);
    return response.data;
};

export const createMockTest = async (payload) => {
    const response = await api.post('/admin/mock-test', payload);
    return response.data;
};

export const updateMockTestAdmin = async (mockTestId, payload) => {
    const response = await api.put(`/admin/mock-test/${mockTestId}`, payload);
    return response.data;
};

export const getAdminLeaderboardResults = async (params = {}) => {
    const response = await api.get('/admin/leaderboard', { params });
    return response.data;
};

export const getAdminRewards = async (params = {}) => {
    const response = await api.get('/admin/rewards', { params });
    return response.data;
};

export const addQuestion = async (payload) => {
    const response = await api.post('/admin/question', payload);
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

export const getMyPurchases = async () => {
    const response = await api.get('/payment/purchases');
    return response.data;
};

export const createPaymentOrder = async (mockTestId) => {
    const response = await api.post('/payment/create-order', { mockTestId });
    return response.data;
};

export const verifyPayment = async (payload) => {
    const response = await api.post('/payment/verify', payload);
    return response.data;
};

export default api;