import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

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

export const getTestDetails = async (testId) => {
  const response = await api.get(`/test/tests/${testId}`);
  return response.data;
};

export const startTest = async (testId) => {
  const response = await api.get(`/test/tests/${testId}/start`);
  return response.data;
};

export const startAttempt = async (userId, mockTestId) => {
  const response = await api.post('/attempt/start', { userId, mockTestId });
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

export default api;
