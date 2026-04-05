import React from 'react';

const items = [
  { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { id: 'series', label: 'Test Series', emoji: '📚' },
  { id: 'mocks', label: 'Mock Tests', emoji: '📝' },
  { id: 'questions', label: 'Questions', emoji: '❓' },
  { id: 'users', label: 'Users', emoji: '👥' },
  { id: 'leaderboard', label: 'Leaderboard', emoji: '🏆' },
  { id: 'rewards', label: 'Rewards', emoji: '🎁' },
];

export function AdminSidebar({ active, onNavigate, mobileOpen, onCloseMobile }) {
  const Nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      <div className="mb-4 px-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Menu</p>
      </div>
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onNavigate(item.id);
              onCloseMobile?.();
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-lg" aria-hidden>
              {item.emoji}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform dark:border-slate-800 dark:bg-slate-900 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center border-b border-slate-100 px-4 dark:border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white">
            Q
          </div>
          <div className="ml-3">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Quizzer</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Admin</p>
          </div>
        </div>
        {Nav}
        <div className="mt-auto border-t border-slate-100 p-4 text-[10px] text-slate-400 dark:border-slate-800">
          Quiz platform control
        </div>
      </aside>
    </>
  );
}
