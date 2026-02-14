import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import React from 'react'

const mockState = { current: {} }

vi.mock('../src/store/useStore', () => ({
  useStore: () => mockState.current
}))

let Standings

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        {component}
      </Suspense>
    </BrowserRouter>
  )
}

describe('Standings Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    Standings = (await import('../src/pages/Standings')).default
  })
  
  afterEach(() => {
    mockState.current = {}
  })
  
  it('未选择赛事时应显示提示', () => {
    mockState.current = {
      currentEvent: null,
      standings: [],
      fetchStandings: vi.fn(),
      calculateStandings: vi.fn()
    }
    renderWithRouter(<Standings />)
    expect(screen.getByText('请先选择或创建一个赛事')).toBeInTheDocument()
  })
  
  it('应渲染页面标题', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      standings: [],
      fetchStandings: vi.fn(),
      calculateStandings: vi.fn()
    }
    renderWithRouter(<Standings />)
    expect(screen.getByText('成绩统计')).toBeInTheDocument()
  })
  
  it('应显示计算成绩按钮', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      standings: [],
      fetchStandings: vi.fn(),
      calculateStandings: vi.fn()
    }
    renderWithRouter(<Standings />)
    expect(screen.getByText('📊 计算成绩')).toBeInTheDocument()
  })
  
  it('无成绩数据时应显示提示', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      standings: [],
      fetchStandings: vi.fn(),
      calculateStandings: vi.fn()
    }
    renderWithRouter(<Standings />)
    expect(screen.getByText('暂无成绩数据')).toBeInTheDocument()
  })
  
  it('应显示成绩排名表', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      standings: [
        { standing_id: 1, team_name: '队伍A', ranking: 1, total_points: 3, matches_won: 3, matches_lost: 0 },
        { standing_id: 2, team_name: '队伍B', ranking: 2, total_points: 2, matches_won: 2, matches_lost: 1 }
      ],
      fetchStandings: vi.fn(),
      calculateStandings: vi.fn()
    }
    renderWithRouter(<Standings />)
    expect(screen.getByText('队伍A')).toBeInTheDocument()
    expect(screen.getByText('队伍B')).toBeInTheDocument()
  })
  
  it('应显示排名', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      standings: [
        { standing_id: 1, team_name: '队伍A', ranking: 1, total_points: 3 },
        { standing_id: 2, team_name: '队伍B', ranking: 2, total_points: 2 },
        { standing_id: 3, team_name: '队伍C', ranking: 3, total_points: 1 }
      ],
      fetchStandings: vi.fn(),
      calculateStandings: vi.fn()
    }
    renderWithRouter(<Standings />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
  
  it('应显示导出积分榜按钮', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      standings: [{ standing_id: 1, team_name: '队伍A', ranking: 1 }],
      fetchStandings: vi.fn(),
      calculateStandings: vi.fn()
    }
    renderWithRouter(<Standings />)
    expect(screen.getByText('📥 导出积分榜')).toBeInTheDocument()
  })
  
  it('应显示导出赛程表按钮', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      standings: [],
      fetchStandings: vi.fn(),
      calculateStandings: vi.fn()
    }
    renderWithRouter(<Standings />)
    expect(screen.getByText('📥 导出赛程表')).toBeInTheDocument()
  })
  
  it('应显示导出比赛记录按钮', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      standings: [],
      fetchStandings: vi.fn(),
      calculateStandings: vi.fn()
    }
    renderWithRouter(<Standings />)
    expect(screen.getByText('📥 导出比赛记录')).toBeInTheDocument()
  })
  
  it('应显示排名规则说明', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      standings: [],
      fetchStandings: vi.fn(),
      calculateStandings: vi.fn()
    }
    renderWithRouter(<Standings />)
    expect(screen.getByText('排名规则说明')).toBeInTheDocument()
  })
  
  it('应显示比赛规则说明', () => {
    mockState.current = {
      currentEvent: { event_id: 1, event_name: '测试赛事' },
      standings: [],
      fetchStandings: vi.fn(),
      calculateStandings: vi.fn()
    }
    renderWithRouter(<Standings />)
    expect(screen.getByText('比赛规则说明')).toBeInTheDocument()
  })
})
