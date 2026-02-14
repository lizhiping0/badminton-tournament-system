import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import ConfirmDialog from '../components/ConfirmDialog'

function Teams() {
  const { currentEvent, teams, fetchTeams, createTeam, updateTeam, deleteTeam, fetchPlayers, createPlayer, deletePlayer } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [teamPlayers, setTeamPlayers] = useState([])
  const [formData, setFormData] = useState({
    team_name: '',
    contact_person: '',
    contact_phone: '',
  })
  const [playerForm, setPlayerForm] = useState({ player_name: '', gender: '男' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: '', id: null, name: '' })
  
  const teamNameInputRef = useRef(null)
  const playerNameInputRef = useRef(null)

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  useEffect(() => {
    if (currentEvent) {
      fetchTeams(currentEvent.event_id)
    }
  }, [currentEvent])

  useEffect(() => {
    if (selectedTeam) {
      loadPlayers(selectedTeam.team_id)
    }
  }, [selectedTeam])
  
  useEffect(() => {
    if (showForm && teamNameInputRef.current) {
      teamNameInputRef.current.focus()
    }
  }, [showForm])
  
  useEffect(() => {
    if (selectedTeam && playerNameInputRef.current) {
      playerNameInputRef.current.focus()
    }
  }, [selectedTeam])

  const loadPlayers = async (teamId) => {
    const players = await fetchPlayers(teamId)
    setTeamPlayers(players)
  }
  
  const maleCount = teamPlayers.filter(p => p.gender === '男').length
  const femaleCount = teamPlayers.filter(p => p.gender === '女').length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentEvent) {
      showMessage('error', '请先选择赛事')
      return
    }
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.team_id, formData)
        showMessage('success', '队伍已更新')
      } else {
        await createTeam({ ...formData, event_id: currentEvent.event_id })
        showMessage('success', '队伍已添加')
      }
      setShowForm(false)
      setEditingTeam(null)
      setFormData({ team_name: '', contact_person: '', contact_phone: '' })
    } catch (error) {
      showMessage('error', '保存失败: ' + error.message)
    }
  }

  const handleEdit = (team) => {
    setEditingTeam(team)
    setFormData({
      team_name: team.team_name,
      contact_person: team.contact_person || '',
      contact_phone: team.contact_phone || '',
    })
    setShowForm(true)
  }

  const handleDeleteClick = (team) => {
    setDeleteConfirm({ isOpen: true, type: 'team', id: team.team_id, name: team.team_name })
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.type === 'team') {
      await deleteTeam(deleteConfirm.id)
      showMessage('success', '队伍已删除')
      if (selectedTeam?.team_id === deleteConfirm.id) {
        setSelectedTeam(null)
      }
    } else if (deleteConfirm.type === 'player') {
      await deletePlayer(deleteConfirm.id)
      loadPlayers(selectedTeam.team_id)
      showMessage('success', '队员已删除')
    }
    setDeleteConfirm({ isOpen: false, type: '', id: null, name: '' })
  }

  const handleDeletePlayerClick = (player) => {
    setDeleteConfirm({ isOpen: true, type: 'player', id: player.player_id, name: player.player_name })
  }

  const handleAddPlayer = async (e) => {
    e.preventDefault()
    if (!selectedTeam) return
    
    const trimmedName = playerForm.player_name.trim()
    if (!trimmedName) {
      showMessage('error', '请输入姓名')
      return
    }
    
    if (teamPlayers.some(p => p.player_name === trimmedName)) {
      showMessage('error', '该队员已存在，姓名不能重复')
      return
    }
    
    if (playerForm.gender === '男' && maleCount >= 4) {
      showMessage('error', '每队最多4名男队员')
      return
    }
    
    if (playerForm.gender === '女' && femaleCount >= 4) {
      showMessage('error', '每队最多4名女队员')
      return
    }
    
    try {
      await createPlayer({ ...playerForm, player_name: trimmedName, team_id: selectedTeam.team_id })
      setPlayerForm({ player_name: '', gender: '男' })
      loadPlayers(selectedTeam.team_id)
      if (playerNameInputRef.current) {
        playerNameInputRef.current.focus()
      }
    } catch (error) {
      showMessage('error', '添加失败: ' + error.message)
    }
  }

  if (!currentEvent) {
    return (
      <div className="card text-center py-12 animate-fade-in">
        <div className="text-4xl mb-3">👥</div>
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
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">队伍管理</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">管理参赛队伍和队员信息</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingTeam(null)
            setFormData({ team_name: '', contact_person: '', contact_phone: '' })
          }}
          className="btn btn-primary w-full sm:w-auto"
        >
          <span className="mr-1">+</span> 添加队伍
        </button>
      </div>

      {showForm && (
        <div className="card animate-fade-in">
          <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-4">
            {editingTeam ? '编辑队伍' : '添加队伍'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">队伍名称 *</label>
                <input
                  type="text"
                  ref={teamNameInputRef}
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                  className="input"
                  required
                  placeholder="输入队伍名称"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">联系人</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="input"
                  placeholder="联系人姓名"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">联系电话</label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="input"
                  placeholder="联系电话"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card">
          <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-4">
            队伍列表 <span className="text-indigo-400">({teams.length})</span>
          </h3>
          {teams.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-slate-400">暂无队伍</p>
              <p className="text-xs text-slate-500 mt-1">点击"添加队伍"开始创建</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {teams.map(team => (
                <div
                  key={team.team_id}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedTeam?.team_id === team.team_id
                      ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20'
                      : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
                  }`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-100 truncate block">{team.team_name}</span>
                      {team.contact_person && (
                        <span className="text-xs text-slate-400">{team.contact_person}</span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(team)}
                        className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-600/50 text-slate-300 hover:bg-slate-600 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteClick(team)}
                        className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-4">
            {selectedTeam ? (
              <>📋 <span className="text-indigo-400">{selectedTeam.team_name}</span> - 参赛人员</>
            ) : '参赛人员'}
          </h3>
          {selectedTeam ? (
            <>
              <div className="mb-4 p-3 rounded-xl bg-slate-700/30 border border-slate-600/30">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                  <span className={`font-medium ${maleCount >= 4 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    👨 男队员: {maleCount}/4
                  </span>
                  <span className={`font-medium ${femaleCount >= 4 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    👩 女队员: {femaleCount}/4
                  </span>
                </div>
              </div>
              <form onSubmit={handleAddPlayer} className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="text"
                  ref={playerNameInputRef}
                  placeholder="输入姓名"
                  value={playerForm.player_name}
                  onChange={(e) => setPlayerForm({ ...playerForm, player_name: e.target.value })}
                  className="input flex-1"
                  required
                />
                <select
                  value={playerForm.gender}
                  onChange={(e) => setPlayerForm({ ...playerForm, gender: e.target.value })}
                  className="input sm:w-20"
                >
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
                <button type="submit" className="btn btn-primary w-full sm:w-auto">添加</button>
              </form>
              {teamPlayers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm">暂无参赛人员</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {teamPlayers.map(player => (
                    <div key={player.player_id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-700/30 border border-slate-600/30">
                      <span className="text-sm text-slate-200">
                        {player.player_name}
                        <span className={`ml-2 text-xs ${player.gender === '男' ? 'text-blue-400' : 'text-pink-400'}`}>
                          ({player.gender})
                        </span>
                      </span>
                      <button
                        onClick={() => handleDeletePlayerClick(player)}
                        className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-slate-400">请选择一个队伍查看参赛人员</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.type === 'team' ? '删除队伍' : '删除队员'}
        message={deleteConfirm.type === 'team' 
          ? `确定要删除队伍"${deleteConfirm.name}"吗？删除后将同时删除该队伍的所有队员数据，此操作无法撤销。`
          : `确定要删除队员"${deleteConfirm.name}"吗？此操作无法撤销。`
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: '', id: null, name: '' })}
      />
    </div>
  )
}

export default Teams
