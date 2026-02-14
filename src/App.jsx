import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Events from './pages/Events'
import Teams from './pages/Teams'
import Schedule from './pages/Schedule'
import Matches from './pages/Matches'
import Standings from './pages/Standings'

function App() {
  const { currentEvent, events, fetchEvents, setCurrentEvent } = useStore()
  const navigate = useNavigate()
  
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">
              🏸 羽毛球团体赛管理系统
            </h1>
            {currentEvent && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">当前赛事:</span>
                <select
                  value={currentEvent.event_id}
                  onChange={(e) => {
                    const event = events.find(ev => ev.event_id === Number(e.target.value))
                    setCurrentEvent(event)
                  }}
                  className="input w-auto"
                >
                  {events.map(event => (
                    <option key={event.event_id} value={event.event_id}>
                      {event.event_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex space-x-1 overflow-x-auto">
            {navItems.map(item => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Events />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/standings" element={<Standings />} />
        </Routes>
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          羽毛球团体赛管理系统 © 2024
        </div>
      </footer>
    </div>
  )
}

export default App
