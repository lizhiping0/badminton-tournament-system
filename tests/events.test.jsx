import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import React from 'react'

const mockState = { current: {} }

vi.mock('../src/store/useStore', () => ({
  useStore: () => mockState.current
}))

let Events

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        {component}
      </Suspense>
    </BrowserRouter>
  )
}

describe('Events Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    Events = (await import('../src/pages/Events')).default
  })
  
  afterEach(() => {
    mockState.current = {}
  })
  
  it('应渲染页面标题', () => {
    mockState.current = {
      events: [],
      currentEvent: null,
      fetchEvents: vi.fn(),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
      setCurrentEvent: vi.fn()
    }
    renderWithRouter(<Events />)
    expect(screen.getByText('赛事管理')).toBeInTheDocument()
  })
  
  it('应显示新建赛事按钮', () => {
    mockState.current = {
      events: [],
      currentEvent: null,
      fetchEvents: vi.fn(),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
      setCurrentEvent: vi.fn()
    }
    renderWithRouter(<Events />)
    expect(screen.getByText('+ 新建赛事')).toBeInTheDocument()
  })
  
  it('无赛事时应显示提示信息', () => {
    mockState.current = {
      events: [],
      currentEvent: null,
      fetchEvents: vi.fn(),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
      setCurrentEvent: vi.fn()
    }
    renderWithRouter(<Events />)
    expect(screen.getByText('暂无赛事，请点击"新建赛事"创建')).toBeInTheDocument()
  })
  
  it('应显示赛事列表', () => {
    mockState.current = {
      events: [
        { event_id: 1, event_name: '测试赛事1', event_year: 2024, status: '进行中' },
        { event_id: 2, event_name: '测试赛事2', event_year: 2024, status: '筹备中' }
      ],
      currentEvent: null,
      fetchEvents: vi.fn(),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
      setCurrentEvent: vi.fn()
    }
    renderWithRouter(<Events />)
    expect(screen.getByText('测试赛事1')).toBeInTheDocument()
    expect(screen.getByText('测试赛事2')).toBeInTheDocument()
  })
  
  it('点击新建赛事按钮应显示表单', () => {
    mockState.current = {
      events: [],
      currentEvent: null,
      fetchEvents: vi.fn(),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
      setCurrentEvent: vi.fn()
    }
    renderWithRouter(<Events />)
    fireEvent.click(screen.getByText('+ 新建赛事'))
    expect(screen.getByText('新建赛事')).toBeInTheDocument()
  })
  
  it('应显示赛事状态标签', () => {
    mockState.current = {
      events: [
        { event_id: 1, event_name: '进行中赛事', event_year: 2024, status: '进行中' },
        { event_id: 2, event_name: '已结束赛事', event_year: 2024, status: '已结束' }
      ],
      currentEvent: null,
      fetchEvents: vi.fn(),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
      setCurrentEvent: vi.fn()
    }
    renderWithRouter(<Events />)
    expect(screen.getByText('进行中')).toBeInTheDocument()
    expect(screen.getByText('已结束')).toBeInTheDocument()
  })
})
