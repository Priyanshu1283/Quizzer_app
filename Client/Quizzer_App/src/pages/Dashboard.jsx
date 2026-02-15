import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Button from '../components/Button';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [testSeries, setTestSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const data = await api.getTestSeries();
        setTestSeries(data);
      } catch (error) {
        console.error("Failed to fetch test series", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSeries();
  }, []);

  const handleSeriesClick = (seriesId) => {
    navigate(`/series/${seriesId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome, {user?.fullname?.firstName || 'User'}!</h2>
            <p className="text-gray-500">Select a category to start practicing.</p>
          </div>
          <Button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition">
            Logout
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testSeries.map((series) => (
              <div
                key={series._id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-gray-100"
                onClick={() => handleSeriesClick(series._id)}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{series.name}</h3>
                  <p className="text-gray-600 line-clamp-2">{series.description || 'Practice mock tests for this category.'}</p>
                </div>
                <div className="bg-indigo-50 px-6 py-3 border-t border-indigo-100">
                  <span className="text-indigo-700 font-medium text-sm">View Tests &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && testSeries.length === 0 && (
          <div className="text-center py-10 text-gray-500">No test categories available.</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
