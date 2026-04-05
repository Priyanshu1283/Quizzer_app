import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';

const subjectEmojis = ['📐', '🧪', '📚', '🧭', '🔬', '🖥️', '✏️', '🏛️'];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [testSeries, setTestSeries] = useState([]);
  const [mocksCatalog, setMocksCatalog] = useState([]);
  const [purchasedIds, setPurchasedIds] = useState(() => new Set());
  const [leaderboard, setLeaderboard] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchData = async () => {
    try {
      setErrorMessage('');
      const [seriesData, catalogData, purchasesData, leaderboardData, rewardsData] = await Promise.all([
        api.getTestSeries(),
        api.getMocksCatalog(),
        api.getMyPurchases().catch(() => ({ mockTestIds: [] })),
        api.getTopPerformers(),
        api.getMyRewards()
      ]);
      setTestSeries(seriesData);
      setMocksCatalog(Array.isArray(catalogData) ? catalogData : []);
      setPurchasedIds(new Set((purchasesData?.mockTestIds || []).map((id) => String(id))));
      setLeaderboard(leaderboardData.leaderboard || []);
      setRewards(rewardsData || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      setErrorMessage('Could not load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
  const filteredSeries = testSeries.filter(series =>
    (series.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (series.description || '').toLowerCase().includes(search.toLowerCase())
  );
  const mockSearch = search.trim().toLowerCase();
  const filteredMocks = mocksCatalog.filter((m) =>
    !mockSearch ||
    (m.title || '').toLowerCase().includes(mockSearch) ||
    (m.seriesName || '').toLowerCase().includes(mockSearch)
  );
  const featuredSeriesIds = testSeries.slice(0, 2).map(series => series._id);
  const handleQuickStart = () => {
    if (testSeries.length === 0) return;
    navigate(`/series/${testSeries[0]._id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-200 dark:bg-slate-950">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 shadow-lg shadow-blue-900/10">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-black text-white ring-1 ring-white/20">
              Q
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">Quizzer</p>
              <p className="hidden text-[11px] text-blue-100/90 sm:block">Your learning hub</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="hidden items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-3 ring-1 ring-white/15 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                {user?.fullname?.firstName?.[0]?.toUpperCase()}
              </div>
              <span className="max-w-[120px] truncate text-sm font-medium text-white">
                {user?.fullname?.firstName}
              </span>
            </div>
            <Button
              onClick={logout}
              className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Sign out
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-600 to-violet-700 px-4 pb-12 pt-10 sm:px-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-200/90">Dashboard</p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Hello, {user?.fullname?.firstName || 'Student'}
            <span className="ml-2 inline-block" aria-hidden>👋</span>
          </h1>
          <p className="mt-2 max-w-xl text-base text-blue-100/95">
            Pick a test series, practice with timed mocks, and climb the leaderboard.
          </p>

          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-100">Series available</p>
              <p className="mt-1 text-3xl font-black tabular-nums text-white">{testSeries.length}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-100">Rewards claimed</p>
              <p className="mt-1 text-3xl font-black tabular-nums text-white">
                {rewards.filter(r => r.status === 'claimed').length}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              onClick={handleQuickStart}
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 disabled:opacity-50"
              disabled={testSeries.length === 0}
            >
              Quick start
            </Button>
            <span className="text-sm text-blue-100/90">Opens your first available series.</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 dark:text-slate-100">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Main column */}
          <div className="space-y-10 lg:col-span-8 animate-in">
            {/* How it works */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-none">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4 dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-900">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">How it works</h2>
                <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">Three steps to your next mock</p>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-3">
                {[
                  { title: 'Pick a series', desc: 'Choose your exam category and mock test.' },
                  { title: 'Take the test', desc: 'Timed questions with clear progress.' },
                  { title: 'See results', desc: 'Review scores and improve faster.' },
                ].map((item, idx) => (
                  <div
                    key={item.title}
                    className="relative rounded-2xl border border-slate-100 bg-slate-50/80 p-5 transition hover:border-blue-200 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-500/40 dark:hover:bg-slate-800"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white dark:bg-blue-500">
                      {idx + 1}
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                    <div className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Test series */}
            <section>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Test series</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Browse categories and open mock tests.</p>
                </div>
              </div>

              {!loading && testSeries.length > 0 && (
                <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50/80 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900/50 dark:from-blue-950/40 dark:to-indigo-950/40">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-md shadow-blue-600/25 dark:bg-blue-500">
                      ⚡
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Get started fast</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Jump into a featured series and attempt your first mock.</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleQuickStart}
                    className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700"
                  >
                    Start now
                  </Button>
                </div>
              )}

              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" aria-hidden>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none ring-0 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                    placeholder="Search by name or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">{filteredSeries.length}</span>
                    <span className="ml-1">results</span>
                  </div>
                  <Button
                    onClick={fetchData}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                  <span className="mt-0.5 text-red-500 dark:text-red-400" aria-hidden>!</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-44 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-slate-700/80" />
                  ))}
                </div>
              ) : testSeries.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-600 dark:bg-slate-900/80">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl dark:bg-slate-800">📭</div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">No categories yet</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Check back soon or refresh.</p>
                  <div className="mt-6">
                    <Button onClick={handleQuickStart} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                      Reload series
                    </Button>
                  </div>
                </div>
              ) : filteredSeries.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-600 dark:bg-slate-900/80">
                  <p className="font-medium text-slate-600 dark:text-slate-300">No matches for “{search}”</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try another search term.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {filteredSeries.map((series, idx) => (
                    <div
                      key={series._id}
                      onClick={() => navigate(`/series/${series._id}`)}
                      className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/50 dark:hover:shadow-slate-900/40"
                    >
                      <div
                        className="h-1.5 w-full"
                        style={{ background: `linear-gradient(90deg, hsl(${idx * 47 + 220}, 70%, 52%), hsl(${idx * 47 + 250}, 65%, 58%))` }}
                      />
                      <div className="p-6">
                        <div className="mb-4 flex items-start justify-between gap-2">
                          {featuredSeriesIds.includes(series._id) ? (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800/80">
                              Featured
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="text-3xl leading-none opacity-90" aria-hidden>
                            {subjectEmojis[idx % subjectEmojis.length]}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 transition group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                          {series.name}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {series.description || 'Practice mock tests for this category.'}
                        </p>
                        {series.mockPricing && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {series.mockPricing.hasFree && (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800/60">
                                Free · {series.mockPricing.freeCount} mock{series.mockPricing.freeCount !== 1 ? 's' : ''}
                              </span>
                            )}
                            {series.mockPricing.hasPaid && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800/60">
                                Paid · from ₹{Number(series.mockPricing.minPaidPrice || 0).toFixed(0)} ({series.mockPricing.paidCount})
                              </span>
                            )}
                            {!series.mockPricing.hasFree && !series.mockPricing.hasPaid && (
                              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">No mocks in this series yet</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-3.5 dark:border-slate-700 dark:bg-slate-800/50">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">View mock tests</span>
                        <span className="text-sm font-semibold text-blue-600 transition group-hover:translate-x-0.5 dark:text-blue-400">
                          Open →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Mock tests catalog — each row shows free vs paid */}
            <section>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">All mock tests</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Every test listed with series, duration, and whether it is free or paid. Paid tests unlock after Razorpay checkout.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="h-40 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-slate-700/80" />
              ) : filteredMocks.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-900/80">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No mock tests match your search.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900">
                  <div className="hidden border-b border-slate-100 bg-slate-50/90 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 sm:grid sm:grid-cols-[1fr_minmax(0,140px)_100px_100px] sm:gap-3">
                    <span>Test</span>
                    <span>Series</span>
                    <span>Duration</span>
                    <span className="text-right sm:text-left">Access</span>
                  </div>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredMocks.map((m) => {
                      const id = String(m._id);
                      const owned = m.isPaid && purchasedIds.has(id);
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => navigate(`/test/${id}/instructions`)}
                            className="flex w-full flex-col gap-2 px-4 py-4 text-left transition hover:bg-slate-50/90 dark:hover:bg-slate-800/80 sm:grid sm:grid-cols-[1fr_minmax(0,140px)_100px_100px] sm:items-center sm:gap-3"
                          >
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{m.title}</span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{m.seriesName}</span>
                            <span className="text-sm tabular-nums text-slate-600 dark:text-slate-400">{m.totalTime} min</span>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              {m.isPaid ? (
                                <>
                                  <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                                    ₹{Number(m.price).toFixed(0)}
                                  </span>
                                  {owned && (
                                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                                      Unlocked
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                                  Free
                                </span>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>

            {/* Rewards */}
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">My rewards</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Certificates and prizes from top finishes.</p>
              </div>
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900">
                {rewards.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-3xl dark:bg-amber-950/50">🏆</div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">No rewards yet</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Finish in the top 3 on a test to earn rewards.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rewards.map((reward) => (
                      <li key={reward._id} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl" aria-hidden>{rankEmoji(reward.rank)}</span>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{reward.mockTestId?.title || 'Mock Test'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Rank #{reward.rank} · {reward.rewardType}</p>
                          </div>
                        </div>
                        {reward.status === 'eligible' ? (
                          <Button
                            onClick={() => handleClaimReward(reward._id)}
                            disabled={claimingId === reward._id}
                            className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 sm:w-auto"
                          >
                            {claimingId === reward._id ? 'Claiming...' : 'Claim reward'}
                          </Button>
                        ) : (
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              reward.status === 'claimed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                            }`}
                          >
                            {reward.status}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-4 animate-in lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Quick actions</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  onClick={handleQuickStart}
                  className="rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                  disabled={testSeries.length === 0}
                >
                  Start mock
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  View series
                </Button>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Tip: try a featured series first to learn the exam flow.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Leaderboard</h2>
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900">
                <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 px-5 py-5 text-center">
                  <p className="text-sm font-bold text-white">Top 10 performers</p>
                  <p className="mt-0.5 text-xs text-blue-100/90">Overall rankings</p>
                </div>
                {leaderboard.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No scores yet. Be the first!
                  </div>
                ) : (
                  <ul className="max-h-[min(420px,50vh)] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                    {leaderboard.map((entry, idx) => (
                      <li
                        key={entry._id}
                        className="flex items-center justify-between gap-2 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/80"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
                                : idx === 1
                                  ? 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100'
                                  : idx === 2
                                    ? 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                          </div>
                          <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                            {entry.userId?.fullname?.firstName} {entry.userId?.fullname?.lastName?.charAt(0)}.
                          </span>
                        </div>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">
                          {entry.score}
                          <span className="ml-0.5 text-[10px] font-normal text-slate-400 dark:text-slate-500">pts</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Keep practicing to climb up.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-blue-700 p-6 text-white shadow-lg shadow-indigo-900/20">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Daily tip</p>
              <p className="mt-2 text-base font-semibold leading-snug">Short mock tests, often.</p>
              <p className="mt-2 text-sm text-white/85">Regular practice beats long cram sessions.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
