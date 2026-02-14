import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import React from 'react'

const mockState = { current: {} }

vi.mock('../src/store/useStore', () => ({
  useStore: () => mockState.current
}))

let Matches

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        {component}
      </Suspense>
    </BrowserRouter>
  )
}

describe('Matches Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    Matches = (await import('../src/pages/Matches')).default
  })
  
  afterEach(() => {
    mockState.current = {}
  })
  
  it('未选择赛事时应显示提示', () => {
    mockState.current = {
      currentEvent: null,
      teams: [],
      teamMatches: [],
      matchTypes: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      fetchMatchTypes: vi.fn(),
      fetchMatchDetails: vi.fn(),
      fetchPlayers: vi.fn(),
      createMatch: vi.fn(),
      updateMatchScore: vi.fn(),
      correctMatchScore: vi.fn()
    }
    renderWithRouter(<Matches />)
    expect(screen.getByText('请先选择或创建一个赛事')).toBeInTheDocument()
  })
  
  it('应渲染页面标题', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [],
      matchTypes: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      fetchMatchTypes: vi.fn(),
      fetchMatchDetails: vi.fn(),
      fetchPlayers: vi.fn(),
      createMatch: vi.fn(),
      updateMatchScore: vi.fn(),
      correctMatchScore: vi.fn()
    }
    renderWithRouter(<Matches />)
    expect(screen.getByText('比赛记录')).toBeInTheDocument()
  })
  
  it('无比赛时应显示提示', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [],
      matchTypes: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      fetchMatchTypes: vi.fn(),
      fetchMatchDetails: vi.fn(),
      fetchPlayers: vi.fn(),
      createMatch: vi.fn(),
      updateMatchScore: vi.fn(),
      correctMatchScore: vi.fn()
    }
    renderWithRouter(<Matches />)
    expect(screen.getByText('暂无比赛，请先在赛程安排中生成对阵表')).toBeInTheDocument()
  })
  
  it('应显示团体赛列表', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [
        { team_match_id: 1, team_a_name: '队伍A', team_b_name: '队伍B', status: '未开始' }
      ],
      matchTypes: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      fetchMatchTypes: vi.fn(),
      fetchMatchDetails: vi.fn(),
      fetchPlayers: vi.fn(),
      createMatch: vi.fn(),
      updateMatchScore: vi.fn(),
      correctMatchScore: vi.fn()
    }
    renderWithRouter(<Matches />)
    expect(screen.getByText('队伍A vs 队伍B')).toBeInTheDocument()
  })
  
  it('应显示比赛状态', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [
        { team_match_id: 1, team_a_name: '队伍A', team_b_name: '队伍B', status: '已结束', winner_team_name: '队伍A' }
      ],
      matchTypes: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      fetchMatchTypes: vi.fn(),
      fetchMatchDetails: vi.fn(),
      fetchPlayers: vi.fn(),
      createMatch: vi.fn(),
      updateMatchScore: vi.fn(),
      correctMatchScore: vi.fn()
    }
    renderWithRouter(<Matches />)
    expect(screen.getByText('已结束')).toBeInTheDocument()
  })
  
  it('应显示团体赛列表标题', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [],
      matchTypes: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      fetchMatchTypes: vi.fn(),
      fetchMatchDetails: vi.fn(),
      fetchPlayers: vi.fn(),
      createMatch: vi.fn(),
      updateMatchScore: vi.fn(),
      correctMatchScore: vi.fn()
    }
    renderWithRouter(<Matches />)
    expect(screen.getByText('团体赛列表')).toBeInTheDocument()
  })
})
