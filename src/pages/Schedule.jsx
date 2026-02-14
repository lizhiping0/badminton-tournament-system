import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import ConfirmDialog from '../components/ConfirmDialog'

function Schedule() {
  const { currentEvent, teams, teamMatches, fetchTeams, fetchTeamMatches, generateBracket, generateNextRound, createTeamMatch, updateTeamMatch, deleteTeamMatch } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingMatch, setEditingMatch] = useState(null)
  const [formData, setFormData] = useState({
    round_number: 1,
    team_a_id: '',
    team_b_id: '',
    match_time: '',
    venue: '',
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: '', id: null, name: '' })
  
  const teamASelectRef = useRef(null)

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  useEffect(() => {
    if (currentEvent) {
      fetchTeams(currentEvent.event_id)
      fetchTeamMatches(currentEvent.event_id)
    }
  }, [currentEvent])
  
  useEffect(() => {
    if (showForm && teamASelectRef.current) {
      teamASelectRef.current.focus()
    }
  }, [showForm])

  const handleGenerateBracket = async () => {
    if (!currentEvent) return
    if (teams.length < 2) {
      showMessage('error', '至少需要2支队伍才能生成对阵表')
      return
    }
    if (teamMatches.length > 0) {
      setDeleteConfirm({ isOpen: true, type: 'regenerate', id: null, name: '' })
      return
    }
    try {
      await generateBracket(currentEvent.event_id)
      showMessage('success', '对阵表生成成功！')
    } catch (error) {
      showMessage('error', '生成失败: ' + error.message)
    }
  }

  const handleGenerateNextRound = async () => {
    if (!currentEvent) return
    try {
      await generateNextRound(currentEvent.event_id)
      showMessage('success', '下一轮对阵已生成！')
    } catch (error) {
      showMessage('error', '生成失败: ' + error.message)
    }
  }

  const handleClearBracketClick = () => {
    if (teamMatches.length === 0) {
      showMessage('error', '暂无对阵表')
      return
    }
    setDeleteConfirm({ isOpen: true, type: 'clear', id: null, name: '' })
  }

  const handleAddMatch = () => {
    setEditingMatch(null)
    setFormData({
      round_number: 1,
      team_a_id: '',
      team_b_id: '',
      match_time: '',
      venue: '',
    })
    setShowForm(true)
  }

  const handleEditMatch = (match) => {
    setEditingMatch(match)
    setFormData({
      round_number: match.round_number,
      team_a_id: match.team_a_id || '',
      team_b_id: match.team_b_id || '',
      match_time: match.match_time || '',
      venue: match.venue || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentEvent) return
    try {
      if (editingMatch) {
        await updateTeamMatch(editingMatch.team_match_id, formData)
      } else {
        await createTeamMatch({ ...formData, event_id: currentEvent.event_id })
      }
      setShowForm(false)
      setEditingMatch(null)
      setFormData({ round_number: 1, team_a_id: '', team_b_id: '', match_time: '', venue: '' })
      showMessage('success', editingMatch ? '比赛已更新' : '比赛已添加')
    } catch (error) {
      showMessage('error', '保存失败: ' + error.message)
    }
  }

  const handleDeleteClick = (match) => {
    const matchName = `${match.team_a_name} vs ${match.team_b_name || '轮空'}`
    setDeleteConfirm({ isOpen: true, type: 'match', id: match.team_match_id, name: matchName })
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.type === 'match') {
      await deleteTeamMatch(deleteConfirm.id)
      showMessage('success', '比赛已删除')
    } else if (deleteConfirm.type === 'clear') {
      for (const match of teamMatches) {
        await deleteTeamMatch(match.team_match_id)
      }
      showMessage('success', '对阵表已清除')
    } else if (deleteConfirm.type === 'regenerate') {
      for (const match of teamMatches) {
        await deleteTeamMatch(match.team_match_id)
      }
      await generateBracket(currentEvent.event_id)
      showMessage('success', '对阵表已重新生成！')
    }
    setDeleteConfirm({ isOpen: false, type: '', id: null, name: '' })
  }

  const getStatusBadge = (status) => {
    const colors = {
      '未开始': 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
      '进行中': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      '已结束': 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    }
    return colors[status] || 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
  }

  const getRoundName = (round) => {
    const names = { 1: '第一轮', 2: '第二轮', 3: '半决赛', 4: '决赛' }
    return names[round] || `第${round}轮`
  }

  const getRoundIcon = (round) => {
    const icons = { 1: '1️⃣', 2: '2️⃣', 3: '⚔️', 4: '🏆' }
    return icons[round] || '🎯'
  }

  const groupedMatches = teamMatches.reduce((acc, match) => {
    const round = match.round_number
    if (!acc[round]) acc[round] = []
    acc[round].push(match)
    return acc
  }, {})

  const maxRound = teamMatches.length > 0 ? Math.max(...teamMatches.map(m => m.round_number)) : 0
  const currentRoundMatches = teamMatches.filter(m => m.round_number === maxRound)
  const allCurrentRoundEnded = currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.status === '已结束')
  const winners = currentRoundMatches.map(m => m.winner_team_id).filter(Boolean)
  const canGenerateNextRound = allCurrentRoundEnded && winners.length >= 2

  if (!currentEvent) {
    return (
      <div className="card text-center py-12 animate-fade-in">
        <div className="text-4xl mb-3">📅</div>
        <p className="text-slate-400">请先选择或创建一个赛事</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {message.text && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {message.type === 'success' ? '✓ ' : '✕ '}{message.text}
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">赛程安排</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">管理比赛对阵和时间安排</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button onClick={handleAddMatch} className="btn btn-secondary">
            + 手动添加
          </button>
          <button onClick={handleGenerateBracket} className="btn btn-primary">
            🎯 自动生成对阵表
          </button>
          {canGenerateNextRound && (
            <button onClick={handleGenerateNextRound} className="btn btn-primary">
              ⏭️ 生成下一轮
            </button>
          )}
          {teamMatches.length > 0 && (
            <button onClick={handleClearBracketClick} className="btn btn-danger">
              🗑️ 清除对阵表
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card animate-fade-in">
          <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-4">
            {editingMatch ? '编辑比赛' : '手动添加比赛'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">轮次</label>
                <select
                  value={formData.round_number}
                  onChange={(e) => setFormData({ ...formData, round_number: parseInt(e.target.value) })}
                  className="input"
                >
                  <option value={1}>第一轮</option>
                  <option value={2}>第二轮</option>
                  <option value={3}>半决赛</option>
                  <option value={4}>决赛</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">队伍A *</label>
                <select
                  ref={teamASelectRef}
                  value={formData.team_a_id}
                  onChange={(e) => setFormData({ ...formData, team_a_id: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">选择队伍</option>
                  {teams.map(t => (
                    <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">队伍B</label>
                <select
                  value={formData.team_b_id}
                  onChange={(e) => setFormData({ ...formData, team_b_id: e.target.value })}
                  className="input"
                >
                  <option value="">选择队伍（留空为轮空）</option>
                  {teams.filter(t => t.team_id != formData.team_a_id).map(t => (
                    <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">比赛时间</label>
                <input
                  type="datetime-local"
                  value={formData.match_time}
                  onChange={(e) => setFormData({ ...formData, match_time: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">场地</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="input"
                  placeholder="如：1号场"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn btn-primary flex-1 sm:flex-none">保存</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1 sm:flex-none">取消</button>
            </div>
          </form>
        </div>
      )}

      {teamMatches.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-slate-400 mb-2">暂无赛程安排</p>
          <p className="text-xs text-slate-500">请先添加队伍，然后点击"自动生成对阵表"</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(groupedMatches).map(([round, matches]) => (
            <div key={round} className="card">
              <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <span>{getRoundIcon(Number(round))}</span>
                {getRoundName(Number(round))}
              </h3>
              <div className="space-y-3">
                {matches.map(match => {
                  const isBye = !match.team_b_id
                  return (
                    <div key={match.team_match_id} className={`p-3 sm:p-4 rounded-xl border transition-all ${
                      isBye 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="text-center min-w-[80px] sm:min-w-[100px]">
                            <div className="font-medium text-slate-100 text-sm sm:text-base truncate">{match.team_a_name || '待定'}</div>
                          </div>
                          {isBye ? (
                            <div className="text-emerald-400 font-medium text-xs sm:text-sm">✓ 轮空自动晋级</div>
                          ) : (
                            <>
                              <div className="text-slate-500 font-bold text-sm">VS</div>
                              <div className="text-center min-w-[80px] sm:min-w-[100px]">
                                <div className="font-medium text-slate-100 text-sm sm:text-base truncate">{match.team_b_name || '待定'}</div>
                              </div>
                            </>
                          )}
                          {match.winner_team_name && !isBye && (
                            <div className="text-amber-400 text-xs sm:text-sm font-medium">
                              🏆 {match.winner_team_name}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          {match.match_time && (
                            <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-lg">
                              📅 {new Date(match.match_time).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {match.venue && (
                            <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-lg">📍 {match.venue}</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(match.status)}`}>
                            {match.status}
                          </span>
                          {!isBye && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditMatch(match)}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-600/50 text-slate-300 hover:bg-slate-600 transition-colors"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteClick(match)}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              >
                                删除
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-3">📋 对阵规则说明</h3>
        <div className="text-xs sm:text-sm text-slate-400 space-y-1.5">
          <p>• 采用淘汰赛制，每场团体赛包含5场单项比赛</p>
          <p>• 单项出场顺序：男双 → 女单 → 男单 → 女双 → 混双</p>
          <p>• 团体赛胜负判定：先赢得3场单项比赛的队伍获胜</p>
          <p>• 队伍数量为奇数时，自动处理轮空情况</p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={
          deleteConfirm.type === 'match' ? '删除比赛' :
          deleteConfirm.type === 'clear' ? '清除对阵表' :
          '重新生成对阵表'
        }
        message={
          deleteConfirm.type === 'match' 
            ? `确定要删除比赛"${deleteConfirm.name}"吗？删除后将同时删除该比赛的所有比分记录，此操作无法撤销。`
            : deleteConfirm.type === 'clear'
            ? '确定要清除所有对阵表吗？删除后将同时删除所有比赛记录和比分数据，此操作无法撤销。'
            : '已存在对阵表，重新生成将清除现有对阵表和所有比赛数据，此操作无法撤销。'
        }
        confirmText={deleteConfirm.type === 'regenerate' ? '确认重新生成' : '确认删除'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: '', id: null, name: '' })}
      />
    </div>
  )
}

export default Schedule
