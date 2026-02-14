import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import React from 'react'

const mockState = { current: {} }

vi.mock('../src/store/useStore', () => ({
  useStore: () => mockState.current
}))

let Schedule

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        {component}
      </Suspense>
    </BrowserRouter>
  )
}

describe('Schedule Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    Schedule = (await import('../src/pages/Schedule')).default
  })
  
  afterEach(() => {
    mockState.current = {}
  })
  
  it('未选择赛事时应显示提示', () => {
    mockState.current = {
      currentEvent: null,
      teams: [],
      teamMatches: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      generateBracket: vi.fn(),
      createTeamMatch: vi.fn(),
      updateTeamMatch: vi.fn(),
      deleteTeamMatch: vi.fn()
    }
    renderWithRouter(<Schedule />)
    expect(screen.getByText('请先选择或创建一个赛事')).toBeInTheDocument()
  })
  
  it('应渲染页面标题', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      generateBracket: vi.fn(),
      createTeamMatch: vi.fn(),
      updateTeamMatch: vi.fn(),
      deleteTeamMatch: vi.fn()
    }
    renderWithRouter(<Schedule />)
    expect(screen.getByText('赛程安排')).toBeInTheDocument()
  })
  
  it('应显示自动生成对阵表按钮', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      generateBracket: vi.fn(),
      createTeamMatch: vi.fn(),
      updateTeamMatch: vi.fn(),
      deleteTeamMatch: vi.fn()
    }
    renderWithRouter(<Schedule />)
    expect(screen.getByText('自动生成对阵表')).toBeInTheDocument()
  })
  
  it('无赛程时应显示提示信息', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      generateBracket: vi.fn(),
      createTeamMatch: vi.fn(),
      updateTeamMatch: vi.fn(),
      deleteTeamMatch: vi.fn()
    }
    renderWithRouter(<Schedule />)
    expect(screen.getByText('暂无赛程安排')).toBeInTheDocument()
  })
  
  it('应显示对阵表', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [
        { team_match_id: 1, round_number: 1, team_a_name: '队伍A', team_b_name: '队伍B', status: '未开始' }
      ],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      generateBracket: vi.fn(),
      createTeamMatch: vi.fn(),
      updateTeamMatch: vi.fn(),
      deleteTeamMatch: vi.fn()
    }
    renderWithRouter(<Schedule />)
    expect(screen.getByText('队伍A')).toBeInTheDocument()
    expect(screen.getByText('队伍B')).toBeInTheDocument()
  })
  
  it('应显示轮次标题', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [
        { team_match_id: 1, round_number: 1, team_a_name: '队伍A', team_b_name: '队伍B', status: '未开始' }
      ],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      generateBracket: vi.fn(),
      createTeamMatch: vi.fn(),
      updateTeamMatch: vi.fn(),
      deleteTeamMatch: vi.fn()
    }
    renderWithRouter(<Schedule />)
    expect(screen.getByText('第一轮')).toBeInTheDocument()
  })
  
  it('应显示比赛状态', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [
        { team_match_id: 1, round_number: 1, team_a_name: '队伍A', team_b_name: '队伍B', status: '进行中' }
      ],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      generateBracket: vi.fn(),
      createTeamMatch: vi.fn(),
      updateTeamMatch: vi.fn(),
      deleteTeamMatch: vi.fn()
    }
    renderWithRouter(<Schedule />)
    expect(screen.getByText('进行中')).toBeInTheDocument()
  })
  
  it('应显示手动添加按钮', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      generateBracket: vi.fn(),
      createTeamMatch: vi.fn(),
      updateTeamMatch: vi.fn(),
      deleteTeamMatch: vi.fn()
    }
    renderWithRouter(<Schedule />)
    expect(screen.getByText('+ 手动添加')).toBeInTheDocument()
  })
  
  it('应显示对阵规则说明', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      teamMatches: [],
      fetchTeams: vi.fn(),
      fetchTeamMatches: vi.fn(),
      generateBracket: vi.fn(),
      createTeamMatch: vi.fn(),
      updateTeamMatch: vi.fn(),
      deleteTeamMatch: vi.fn()
    }
    renderWithRouter(<Schedule />)
    expect(screen.getByText('对阵规则说明')).toBeInTheDocument()
  })
})
