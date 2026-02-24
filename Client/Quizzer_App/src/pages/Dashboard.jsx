import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Button from '../components/Button';

const subjectEmojis = ['📐', '🧪', '📚', '🧭', '🔬', '🖥️', '✏️', '🏛️'];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [testSeries, setTestSeries] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seriesData, leaderboardData, rewardsData] = await Promise.all([
          api.getTestSeries(),
          api.getTopPerformers(),
          api.getMyRewards()
        ]);
        setTestSeries(seriesData);
        setLeaderboard(leaderboardData.leaderboard || []);
        setRewards(rewardsData || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleClaimReward = async (rewardId) => {
    setClaimingId(rewardId);
    try {
      await api.claimReward(rewardId);
      const rewardsData = await api.getMyRewards();
      setRewards(rewardsData);
    } catch (error) {
      console.error("Claim failed", error);
    } finally {
      setClaimingId(null);
    }
  };

  const rankEmoji = (rank) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

  return (
    <div className="min-h-screen" style={{ background: '#f8faff' }}>
      {/* Top Navbar */}
      <nav style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)', boxShadow: '0 2px 12px rgba(37,99,235,0.2)' }}
        className="sticky top-0 z-30 px-6 py-0 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center text-white font-black text-xl">Q</div>
          <span className="text-white font-bold text-lg tracking-tight">Quizzer</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              {user?.fullname?.firstName?.[0]?.toUpperCase()}
            </div>
            <span className="text-white text-sm font-medium">{user?.fullname?.firstName}</span>
          </div>
          <Button onClick={logout} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs px-3 py-2">
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 50%, #7c3aed 100%)' }} className="px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-white mb-1">
            Hello, {user?.fullname?.firstName || 'Student'}! 👋
          </h1>
          <p className="text-blue-100 text-base">Ready to level up today? Choose a category below.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Area */}
          <div className="lg:col-span-2 space-y-8 animate-in">

            {/* Test Series */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded-full inline-block"></span>
                Available Test Series
              </h2>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-gray-200 rounded-2xl animate-pulse" />)}
                </div>
              ) : testSeries.length === 0 ? (
                <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 bg-white">
                  No test categories available yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {testSeries.map((series, idx) => (
                    <div
                      key={series._id}
                      onClick={() => navigate(`/series/${series._id}`)}
                      className="group cursor-pointer bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}
                    >
                      <div className="h-2 w-full" style={{ background: `hsl(${idx * 47 + 220}, 75%, 55%)` }} />
                      <div className="p-5">
                        <div className="text-3xl mb-3">{subjectEmojis[idx % subjectEmojis.length]}</div>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{series.name}</h3>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{series.description || 'Practice mock tests for this category.'}</p>
                      </div>
                      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Mock Tests Available</span>
                        <span className="text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">Attempt →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Rewards Section */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-yellow-400 rounded-full inline-block"></span>
                My Rewards & Certificates
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                {rewards.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-5xl mb-3">🏆</div>
                    <p className="font-medium">No rewards yet</p>
                    <p className="text-sm mt-1">Finish in the top 3 to earn rewards!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {rewards.map((reward) => (
                      <div key={reward._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{rankEmoji(reward.rank)}</div>
                          <div>
                            <div className="font-semibold text-gray-900">{reward.mockTestId?.title || 'Mock Test'}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Rank #{reward.rank} · {reward.rewardType}</div>
                          </div>
                        </div>
                        {reward.status === 'eligible' ? (
                          <Button
                            onClick={() => handleClaimReward(reward._id)}
                            disabled={claimingId === reward._id}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 px-4 focus:ring-green-500"
                          >
                            {claimingId === reward._id ? 'Claiming...' : 'Claim Reward'}
                          </Button>
                        ) : (
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${reward.status === 'claimed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {reward.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="animate-in" style={{ animationDelay: '80ms' }}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full inline-block"></span>
              🏆 Leaderboard
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
              <div className="p-4 text-center" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)' }}>
                <p className="text-white font-bold text-sm">Top 10 Performers</p>
                <p className="text-blue-200 text-xs mt-0.5">Overall Rankings</p>
              </div>
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No data yet. Be the first!</div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {leaderboard.map((entry, idx) => (
                    <li key={entry._id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-700' : idx === 2 ? 'bg-orange-300 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>
                          {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                          {entry.userId?.fullname?.firstName} {entry.userId?.fullname?.lastName?.charAt(0)}.
                        </div>
                      </div>
                      <div className="text-sm font-bold text-blue-600">{entry.score} <span className="text-gray-400 font-normal text-xs">pts</span></div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="p-3 text-center bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-400">Keep practicing to reach the top! 💪</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
