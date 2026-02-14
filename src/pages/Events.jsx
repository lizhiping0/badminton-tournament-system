import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import ConfirmDialog from '../components/ConfirmDialog'

function Events() {
  const { events, currentEvent, fetchEvents, createEvent, updateEvent, deleteEvent, setCurrentEvent } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' })
  const [formData, setFormData] = useState({
    event_name: '',
    event_year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
  })
  
  const eventNameInputRef = useRef(null)

  useEffect(() => {
    fetchEvents()
  }, [])
  
  useEffect(() => {
    if (showForm && eventNameInputRef.current) {
      eventNameInputRef.current.focus()
    }
  }, [showForm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.event_id, formData)
      } else {
        const event = await createEvent(formData)
        if (!event) {
          throw new Error('创建赛事失败：服务器未返回数据')
        }
        setCurrentEvent(event)
      }
      setShowForm(false)
      setEditingEvent(null)
      setFormData({ event_name: '', event_year: new Date().getFullYear(), start_date: '', end_date: '' })
    } catch (error) {
      console.error('保存赛事失败:', error)
      alert('保存赛事失败: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      event_name: event.event_name,
      event_year: event.event_year || new Date().getFullYear(),
      start_date: event.start_date || '',
      end_date: event.end_date || '',
    })
    setShowForm(true)
  }

  const handleDeleteClick = (event) => {
    setDeleteConfirm({ isOpen: true, id: event.event_id, name: event.event_name })
  }

  const handleDeleteConfirm = async () => {
    await deleteEvent(deleteConfirm.id)
    setDeleteConfirm({ isOpen: false, id: null, name: '' })
  }

  const handleSelect = (event) => {
    setCurrentEvent(event)
  }

  const getStatusBadge = (status) => {
    const colors = {
      '筹备中': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      '进行中': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      '已结束': 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
      '已归档': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    }
    return colors[status] || 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">赛事管理</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">管理所有羽毛球团体赛事</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingEvent(null)
            setFormData({ event_name: '', event_year: new Date().getFullYear(), start_date: '', end_date: '' })
          }}
          className="btn btn-primary w-full sm:w-auto"
        >
          <span className="mr-1">+</span> 新建赛事
        </button>
      </div>

      {showForm && (
        <div className="card animate-fade-in">
          <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-4">
            {editingEvent ? '编辑赛事' : '新建赛事'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">赛事名称 *</label>
                <input
                  type="text"
                  ref={eventNameInputRef}
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  className="input"
                  required
                  placeholder="输入赛事名称"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">年份</label>
                <input
                  type="number"
                  value={formData.event_year}
                  onChange={(e) => setFormData({ ...formData, event_year: parseInt(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  开始日期 <span className="text-slate-500 font-normal">(格式: 年/月/日)</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  结束日期 <span className="text-slate-500 font-normal">(格式: 年/月/日)</span>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn btn-primary flex-1 sm:flex-none" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1 sm:flex-none">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-slate-400">暂无赛事</p>
            <p className="text-xs text-slate-500 mt-1">点击"新建赛事"开始创建</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {events.map(event => (
              <div 
                key={event.event_id} 
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  currentEvent?.event_id === event.event_id 
                    ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20' 
                    : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-100 truncate">{event.event_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{event.event_year || '-'}年</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ml-2 ${getStatusBadge(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                
                <div className="text-xs text-slate-400 mb-3">
                  {event.start_date && event.end_date 
                    ? `${event.start_date} ~ ${event.end_date}`
                    : event.start_date || event.end_date || '日期待定'}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelect(event)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                  >
                    选择
                  </button>
                  <button
                    onClick={() => handleEdit(event)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-600/50 text-slate-300 hover:bg-slate-600 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteClick(event)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="删除赛事"
        message={`确定要删除赛事"${deleteConfirm.name}"吗？删除后将同时删除该赛事下的所有队伍、比赛记录等数据，此操作无法撤销。`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
      />
    </div>
  )
}

export default Events
