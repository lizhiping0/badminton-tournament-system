import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

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
      for (const match of teamMatches) {
        await deleteTeamMatch(match.team_match_id)
      }
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

  const handleClearBracket = async () => {
    if (teamMatches.length === 0) {
      showMessage('error', '暂无对阵表')
      return
    }
    for (const match of teamMatches) {
      await deleteTeamMatch(match.team_match_id)
    }
    showMessage('success', '对阵表已清除')
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

  const handleDelete = async (id) => {
    await deleteTeamMatch(id)
    showMessage('success', '比赛已删除')
  }

  const getStatusBadge = (status) => {
    const colors = {
      '未开始': 'bg-gray-100 text-gray-800',
      '进行中': 'bg-green-100 text-green-800',
      '已结束': 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getRoundName = (round) => {
    const names = { 1: '第一轮', 2: '第二轮', 3: '半决赛', 4: '决赛' }
    return names[round] || `第${round}轮`
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
      <div className="card text-center py-12">
        <p className="text-gray-500">请先选择或创建一个赛事</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? '✓ ' : '✕ '}{message.text}
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-800">赛程安排</h2>
        <div className="flex gap-2">
          <button onClick={handleAddMatch} className="btn btn-secondary">
            + 手动添加
          </button>
          <button onClick={handleGenerateBracket} className="btn btn-primary">
            自动生成对阵表
          </button>
          {canGenerateNextRound && (
            <button onClick={handleGenerateNextRound} className="btn btn-primary">
              生成下一轮
            </button>
          )}
          {teamMatches.length > 0 && (
            <button onClick={handleClearBracket} className="btn btn-danger">
              清除对阵表
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">{editingMatch ? '编辑比赛' : '手动添加比赛'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">轮次</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">队伍A *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">队伍B</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">比赛时间</label>
                <input
                  type="datetime-local"
                  value={formData.match_time}
                  onChange={(e) => setFormData({ ...formData, match_time: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">场地</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="input"
                  placeholder="如：1号场"
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

      {teamMatches.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">暂无赛程安排</p>
          <p className="text-sm text-gray-400">请先添加队伍，然后点击"自动生成对阵表"或"手动添加"比赛</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMatches).map(([round, matches]) => (
            <div key={round} className="card">
              <h3 className="text-lg font-semibold mb-4">{getRoundName(Number(round))}</h3>
              <div className="space-y-3">
                {matches.map(match => {
                  const isBye = !match.team_b_id
                  return (
                    <div key={match.team_match_id} className={`p-4 rounded-lg ${isBye ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[100px]">
                            <div className="font-medium">{match.team_a_name || '待定'}</div>
                          </div>
                          {isBye ? (
                            <div className="text-green-600 font-medium text-sm">轮空自动晋级</div>
                          ) : (
                            <>
                              <div className="text-gray-400 font-bold">VS</div>
                              <div className="text-center min-w-[100px]">
                                <div className="font-medium">{match.team_b_name || '待定'}</div>
                              </div>
                            </>
                          )}
                          {match.winner_team_name && !isBye && (
                            <div className="text-green-600 text-sm font-medium">
                              🏆 胜者: {match.winner_team_name}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          {match.match_time && (
                            <span className="text-sm text-gray-500">
                              📅 {new Date(match.match_time).toLocaleString('zh-CN')}
                            </span>
                          )}
                          {match.venue && (
                            <span className="text-sm text-gray-500">📍 {match.venue}</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(match.status)}`}>
                            {match.status}
                          </span>
                          {!isBye && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditMatch(match)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDelete(match.team_match_id)}
                                className="text-red-600 hover:text-red-800 text-sm"
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
        <h3 className="text-lg font-semibold mb-4">对阵规则说明</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>1. 采用淘汰赛制，每场团体赛包含5场单项比赛</p>
          <p>2. 单项出场顺序：男子双打 → 女子单打 → 男子单打 → 女子双打 → 混合双打</p>
          <p>3. 团体赛胜负判定：先赢得3场单项比赛的队伍获胜</p>
          <p>4. 队伍数量为奇数时，自动处理轮空情况</p>
        </div>
      </div>
    </div>
  )
}

export default Schedule
