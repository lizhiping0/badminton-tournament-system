import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

function Events() {
  const { events, currentEvent, fetchEvents, createEvent, updateEvent, deleteEvent, setCurrentEvent } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      alert('保存失败: ' + (error.message || '未知错误'))
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

  const handleDelete = async (id) => {
    if (confirm('确定要删除这个赛事吗？相关数据将被一并删除。')) {
      await deleteEvent(id)
    }
  }

  const handleSelect = (event) => {
    setCurrentEvent(event)
  }

  const getStatusBadge = (status) => {
    const colors = {
      '筹备中': 'bg-yellow-100 text-yellow-800',
      '进行中': 'bg-green-100 text-green-800',
      '已结束': 'bg-gray-100 text-gray-800',
      '已归档': 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">赛事管理</h2>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingEvent(null)
            setFormData({ event_name: '', event_year: new Date().getFullYear(), start_date: '', end_date: '' })
          }}
          className="btn btn-primary"
        >
          + 新建赛事
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">{editingEvent ? '编辑赛事' : '新建赛事'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">赛事名称 *</label>
                <input
                  type="text"
                  ref={eventNameInputRef}
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年份</label>
                <input
                  type="number"
                  value={formData.event_year}
                  onChange={(e) => setFormData({ ...formData, event_year: parseInt(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">保存</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">取消</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无赛事，请点击"新建赛事"创建</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>赛事名称</th>
                  <th>年份</th>
                  <th>日期</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.event_id} className={currentEvent?.event_id === event.event_id ? 'bg-blue-50' : ''}>
                    <td className="font-medium">{event.event_name}</td>
                    <td>{event.event_year || '-'}</td>
                    <td>
                      {event.start_date && event.end_date 
                        ? `${event.start_date} ~ ${event.end_date}`
                        : event.start_date || event.end_date || '-'}
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelect(event)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          选择
                        </button>
                        <button
                          onClick={() => handleEdit(event)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(event.event_id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Events
