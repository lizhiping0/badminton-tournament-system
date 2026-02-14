import { create } from 'zustand'

const apiBase = '/api'

async function fetchAPI(endpoint, options = {}) {
  let response
  try {
    response = await fetch(`${apiBase}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })
  } catch (networkError) {
    throw new Error('网络连接失败，请检查服务器是否启动')
  }
  
  if (!response.ok) {
    let errorMessage = '请求失败'
    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } else {
        const text = await response.text()
        if (text.includes('Cannot POST') || text.includes('Cannot GET')) {
          errorMessage = 'API接口不存在，请检查服务器配置'
        } else if (response.status === 500) {
          errorMessage = '服务器内部错误'
        } else {
          errorMessage = `请求失败 (${response.status})`
        }
      }
    } catch (parseError) {
      errorMessage = `请求失败 (${response.status})`
    }
    throw new Error(errorMessage)
  }
  
  try {
    return await response.json()
  } catch (parseError) {
    throw new Error('服务器返回数据格式错误')
  }
}

export const useStore = create((set, get) => ({
  events: [],
  currentEvent: null,
  teams: [],
  players: [],
  matchTypes: [],
  teamMatches: [],
  matches: [],
  standings: [],
  loading: false,
  error: null,

  fetchEvents: async () => {
    try {
      const events = await fetchAPI('/events')
      set({ events })
      if (events.length > 0 && !get().currentEvent) {
        const savedEventId = localStorage.getItem('currentEventId')
        const savedEvent = savedEventId ? events.find(e => e.event_id === Number(savedEventId)) : null
        const currentEvent = savedEvent || events[0]
        set({ currentEvent })
        get().fetchTeams(currentEvent.event_id)
      }
    } catch (error) {
      set({ error: error.message })
    }
  },

  setCurrentEvent: (event) => {
    set({ currentEvent: event })
    if (event) {
      localStorage.setItem('currentEventId', event.event_id)
      get().fetchTeams(event.event_id)
      get().fetchTeamMatches(event.event_id)
      get().fetchStandings(event.event_id)
    }
  },

  createEvent: async (data) => {
    const event = await fetchAPI('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    set(state => ({ events: [event, ...state.events] }))
    return event
  },

  updateEvent: async (id, data) => {
    const event = await fetchAPI(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    set(state => ({
      events: state.events.map(e => e.event_id === id ? event : e),
    }))
    return event
  },

  deleteEvent: async (id) => {
    await fetchAPI(`/events/${id}`, { method: 'DELETE' })
    set(state => ({
      events: state.events.filter(e => e.event_id !== id),
      currentEvent: state.currentEvent?.event_id === id ? null : state.currentEvent,
    }))
  },

  fetchTeams: async (eventId) => {
    try {
      const teams = await fetchAPI(`/teams?event_id=${eventId}`)
      set({ teams })
    } catch (error) {
      set({ error: error.message })
    }
  },

  createTeam: async (data) => {
    const team = await fetchAPI('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    set(state => ({ teams: [...state.teams, team] }))
    return team
  },

  updateTeam: async (id, data) => {
    const team = await fetchAPI(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    set(state => ({
      teams: state.teams.map(t => t.team_id === id ? team : t),
    }))
    return team
  },

  deleteTeam: async (id) => {
    await fetchAPI(`/teams/${id}`, { method: 'DELETE' })
    set(state => ({ teams: state.teams.filter(t => t.team_id !== id) }))
  },

  fetchPlayers: async (teamId) => {
    try {
      const players = await fetchAPI(`/players?team_id=${teamId}`)
      return players
    } catch (error) {
      set({ error: error.message })
      return []
    }
  },

  createPlayer: async (data) => {
    const player = await fetchAPI('/players', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return player
  },

  deletePlayer: async (id) => {
    await fetchAPI(`/players/${id}`, { method: 'DELETE' })
  },

  fetchMatchTypes: async () => {
    try {
      const matchTypes = await fetchAPI('/match-types')
      set({ matchTypes })
    } catch (error) {
      set({ error: error.message })
    }
  },

  fetchTeamMatches: async (eventId) => {
    try {
      const teamMatches = await fetchAPI(`/team-matches?event_id=${eventId}`)
      set({ teamMatches })
    } catch (error) {
      set({ error: error.message })
    }
  },

  createTeamMatch: async (data) => {
    const teamMatch = await fetchAPI('/team-matches', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    set(state => ({ teamMatches: [...state.teamMatches, teamMatch] }))
    return teamMatch
  },

  generateBracket: async (eventId) => {
    const teamMatches = await fetchAPI('/team-matches/generate-bracket', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId }),
    })
    set({ teamMatches })
    return teamMatches
  },

  generateNextRound: async (eventId) => {
    const teamMatches = await fetchAPI('/team-matches/generate-next-round', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId }),
    })
    set({ teamMatches })
    return teamMatches
  },

  updateTeamMatch: async (id, data) => {
    const teamMatch = await fetchAPI(`/team-matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    set(state => ({
      teamMatches: state.teamMatches.map(tm => tm.team_match_id === id ? teamMatch : tm),
    }))
    return teamMatch
  },

  deleteTeamMatch: async (id) => {
    await fetchAPI(`/team-matches/${id}`, { method: 'DELETE' })
    set(state => ({ teamMatches: state.teamMatches.filter(tm => tm.team_match_id !== id) }))
  },

  fetchMatchDetails: async (teamMatchId) => {
    try {
      const details = await fetchAPI(`/team-matches/${teamMatchId}`)
      return details
    } catch (error) {
      set({ error: error.message })
      return null
    }
  },

  createMatch: async (data) => {
    const match = await fetchAPI('/matches', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return match
  },

  updateMatchScore: async (id, data) => {
    const match = await fetchAPI(`/matches/${id}/score`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return match
  },

  correctMatchScore: async (id, data) => {
    const match = await fetchAPI(`/matches/${id}/correct`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return match
  },

  fetchStandings: async (eventId) => {
    try {
      const standings = await fetchAPI(`/standings?event_id=${eventId}`)
      set({ standings })
    } catch (error) {
      set({ error: error.message })
    }
  },

  calculateStandings: async (eventId) => {
    const standings = await fetchAPI('/standings/calculate', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId }),
    })
    set({ standings })
    return standings
  },
}))
