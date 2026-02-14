import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from './store/useStore'
import Events from './pages/Events'
import Teams from './pages/Teams'
import Schedule from './pages/Schedule'
import Matches from './pages/Matches'
import Standings from './pages/Standings'

function App() {
  const { currentEvent, events, fetchEvents, setCurrentEvent } = useStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    fetchEvents()
  }, [])

  const navItems = [
    { path: '/', label: '赛事管理', icon: '🏆' },
    { path: '/teams', label: '队伍管理', icon: '👥' },
    { path: '/schedule', label: '赛程安排', icon: '📅' },
    { path: '/matches', label: '比赛记录', icon: '🏸' },
    { path: '/standings', label: '成绩统计', icon: '📊' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg sm:text-xl shadow-lg">
                🏸
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold gradient-text">
                  羽毛球团体赛
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">Tournament Management System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {currentEvent && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xs text-slate-400 hidden sm:inline">当前赛事</span>
                  <select
                    value={currentEvent.event_id}
                    onChange={(e) => {
                      const event = events.find(ev => ev.event_id === Number(e.target.value))
                      setCurrentEvent(event)
                    }}
                    className="input w-28 sm:w-auto text-xs sm:text-sm py-1.5 sm:py-2"
                  >
                    {events.map(event => (
                      <option key={event.event_id} value={event.event_id}>
                        {event.event_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-slate-700/50 text-slate-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="hidden lg:block sticky top-[60px] sm:top-[72px] z-40 glass border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex space-x-1">
            {navItems.map(item => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-300 ${
                      isActive
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl animate-fade-in">
          <div className="flex flex-col h-full pt-4">
            <div className="flex justify-end px-4 mb-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="flex flex-col gap-2 px-4">
              {navItems.map(item => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-700/50'
                      }`
                    }
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Routes>
          <Route path="/" element={<Events />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/standings" element={<Standings />} />
        </Routes>
      </main>

      <footer className="glass border-t border-slate-700/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <p className="text-xs sm:text-sm text-slate-400">
              羽毛球团体赛管理系统 © 2026
            </p>
            <p className="text-xs text-slate-500">
              Built with ❤️ for badminton enthusiasts
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
