import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import React from 'react'

const mockState = { current: {} }

vi.mock('../src/store/useStore', () => ({
  useStore: () => mockState.current
}))

let Teams

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        {component}
      </Suspense>
    </BrowserRouter>
  )
}

describe('Teams Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    Teams = (await import('../src/pages/Teams')).default
  })
  
  afterEach(() => {
    mockState.current = {}
  })
  
  it('未选择赛事时应显示提示', () => {
    mockState.current = {
      currentEvent: null,
      teams: [],
      fetchTeams: vi.fn(),
      createTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      fetchPlayers: vi.fn(),
      createPlayer: vi.fn(),
      deletePlayer: vi.fn()
    }
    renderWithRouter(<Teams />)
    expect(screen.getByText('请先选择或创建一个赛事')).toBeInTheDocument()
  })
  
  it('应渲染页面标题', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      fetchTeams: vi.fn(),
      createTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      fetchPlayers: vi.fn(),
      createPlayer: vi.fn(),
      deletePlayer: vi.fn()
    }
    renderWithRouter(<Teams />)
    expect(screen.getByText('队伍管理')).toBeInTheDocument()
  })
  
  it('应显示添加队伍按钮', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      fetchTeams: vi.fn(),
      createTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      fetchPlayers: vi.fn(),
      createPlayer: vi.fn(),
      deletePlayer: vi.fn()
    }
    renderWithRouter(<Teams />)
    expect(screen.getByText('+ 添加队伍')).toBeInTheDocument()
  })
  
  it('无队伍时应显示提示信息', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      fetchTeams: vi.fn(),
      createTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      fetchPlayers: vi.fn(),
      createPlayer: vi.fn(),
      deletePlayer: vi.fn()
    }
    renderWithRouter(<Teams />)
    expect(screen.getByText('暂无队伍，请点击"添加队伍"创建')).toBeInTheDocument()
  })
  
  it('应显示队伍列表', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [
        { team_id: 1, team_name: '队伍A', contact_person: '张三' },
        { team_id: 2, team_name: '队伍B', contact_person: '李四' }
      ],
      fetchTeams: vi.fn(),
      createTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      fetchPlayers: vi.fn(),
      createPlayer: vi.fn(),
      deletePlayer: vi.fn()
    }
    renderWithRouter(<Teams />)
    expect(screen.getByText('队伍A')).toBeInTheDocument()
    expect(screen.getByText('队伍B')).toBeInTheDocument()
  })
  
  it('点击添加队伍按钮应显示表单', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [],
      fetchTeams: vi.fn(),
      createTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      fetchPlayers: vi.fn(),
      createPlayer: vi.fn(),
      deletePlayer: vi.fn()
    }
    renderWithRouter(<Teams />)
    fireEvent.click(screen.getByText('+ 添加队伍'))
    expect(screen.getByText('添加队伍')).toBeInTheDocument()
  })
  
  it('应显示队伍数量', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      teams: [
        { team_id: 1, team_name: '队伍A' },
        { team_id: 2, team_name: '队伍B' },
        { team_id: 3, team_name: '队伍C' }
      ],
      fetchTeams: vi.fn(),
      createTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      fetchPlayers: vi.fn(),
      createPlayer: vi.fn(),
      deletePlayer: vi.fn()
    }
    renderWithRouter(<Teams />)
    expect(screen.getByText('队伍列表 (3)')).toBeInTheDocument()
  })
})
