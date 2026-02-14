import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

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
  
  const teamNameInputRef = useRef(null)
  const playerNameInputRef = useRef(null)

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
      alert('请先选择赛事')
      return
    }
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.team_id, formData)
      } else {
        await createTeam({ ...formData, event_id: currentEvent.event_id })
      }
      setShowForm(false)
      setEditingTeam(null)
      setFormData({ team_name: '', contact_person: '', contact_phone: '' })
    } catch (error) {
      alert('保存失败: ' + error.message)
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

  const handleDelete = async (id) => {
    if (confirm('确定要删除这个队伍吗？相关参赛人员将被一并删除。')) {
      await deleteTeam(id)
      if (selectedTeam?.team_id === id) {
        setSelectedTeam(null)
      }
    }
  }

  const handleAddPlayer = async (e) => {
    e.preventDefault()
    if (!selectedTeam) return
    
    const trimmedName = playerForm.player_name.trim()
    if (!trimmedName) {
      alert('请输入姓名')
      return
    }
    
    if (teamPlayers.some(p => p.player_name === trimmedName)) {
      alert('该队员已存在，姓名不能重复')
      return
    }
    
    if (playerForm.gender === '男' && maleCount >= 4) {
      alert('每队最多4名男队员')
      return
    }
    
    if (playerForm.gender === '女' && femaleCount >= 4) {
      alert('每队最多4名女队员')
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
      alert('添加失败: ' + error.message)
    }
  }

  const handleDeletePlayer = async (id) => {
    if (confirm('确定要删除这个参赛人员吗？')) {
      await deletePlayer(id)
      loadPlayers(selectedTeam.team_id)
    }
  }

  if (!currentEvent) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">请先选择或创建一个赛事</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">队伍管理</h2>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingTeam(null)
            setFormData({ team_name: '', contact_person: '', contact_phone: '' })
          }}
          className="btn btn-primary"
        >
          + 添加队伍
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">{editingTeam ? '编辑队伍' : '添加队伍'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">队伍名称 *</label>
                <input
                  type="text"
                  ref={teamNameInputRef}
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">队伍列表 ({teams.length})</h3>
          {teams.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无队伍，请点击"添加队伍"创建</p>
          ) : (
            <div className="space-y-2">
              {teams.map(team => (
                <div
                  key={team.team_id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTeam?.team_id === team.team_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{team.team_name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {team.contact_person && `(${team.contact_person})`}
                      </span>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(team)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(team.team_id)}
                        className="text-red-600 hover:text-red-800 text-sm"
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
          <h3 className="text-lg font-semibold mb-4">
            {selectedTeam ? `${selectedTeam.team_name} - 参赛人员` : '参赛人员'}
          </h3>
          {selectedTeam ? (
            <>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-4 text-sm">
                  <span className={`font-medium ${maleCount >= 4 ? 'text-green-600' : 'text-gray-600'}`}>
                    男队员: {maleCount}/4
                  </span>
                  <span className={`font-medium ${femaleCount >= 4 ? 'text-green-600' : 'text-gray-600'}`}>
                    女队员: {femaleCount}/4
                  </span>
                  <span className="text-gray-500">
                    (每队限4男4女)
                  </span>
                </div>
              </div>
              <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
                <input
                  type="text"
                  ref={playerNameInputRef}
                  placeholder="姓名"
                  value={playerForm.player_name}
                  onChange={(e) => setPlayerForm({ ...playerForm, player_name: e.target.value })}
                  className="input"
                  style={{ flex: 1, minWidth: '150px' }}
                  required
                />
                <select
                  value={playerForm.gender}
                  onChange={(e) => setPlayerForm({ ...playerForm, gender: e.target.value })}
                  className="input"
                  style={{ width: '60px' }}
                >
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
                <button type="submit" className="btn btn-primary">添加</button>
              </form>
              {teamPlayers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无参赛人员</p>
              ) : (
                <div className="space-y-2">
                  {teamPlayers.map(player => (
                    <div key={player.player_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{player.player_name} ({player.gender})</span>
                      <button
                        onClick={() => handleDeletePlayer(player.player_id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">请选择一个队伍查看参赛人员</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Teams
