import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

function Matches() {
  const { currentEvent, teams, teamMatches, matchTypes, fetchTeams, fetchTeamMatches, fetchMatchTypes, fetchMatchDetails, fetchPlayers, createMatch, updateMatchScore, correctMatchScore } = useStore()
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [matchDetails, setMatchDetails] = useState(null)
  const [teamPlayers, setTeamPlayers] = useState({ a: [], b: [] })
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [scoreForm, setScoreForm] = useState({
    game1_score_a: 0,
    game1_score_b: 0,
    game2_score_a: 0,
    game2_score_b: 0,
    game3_score_a: 0,
    game3_score_b: 0,
  })
  const [showCorrectForm, setShowCorrectForm] = useState(false)
  const [correctReason, setCorrectReason] = useState('')
  const [playerForm, setPlayerForm] = useState({})
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (currentEvent) {
      fetchTeams(currentEvent.event_id)
      fetchTeamMatches(currentEvent.event_id)
      fetchMatchTypes()
    }
  }, [currentEvent])

  useEffect(() => {
    if (selectedMatch) {
      loadMatchDetails(selectedMatch.team_match_id)
    }
  }, [selectedMatch])

  const loadMatchDetails = async (teamMatchId) => {
    const details = await fetchMatchDetails(teamMatchId)
    setMatchDetails(details)
    setCurrentMatchIndex(0)
    
    if (details) {
      const playersA = await fetchPlayers(details.team_a_id)
      const playersB = details.team_b_id ? await fetchPlayers(details.team_b_id) : []
      setTeamPlayers({ a: playersA, b: playersB })
      
      const newPlayerForm = {}
      if (details.matches) {
        details.matches.forEach(m => {
          newPlayerForm[m.match_id] = {
            team_a_player1_id: m.team_a_player1_id || '',
            team_a_player2_id: m.team_a_player2_id || '',
            team_b_player1_id: m.team_b_player1_id || '',
            team_b_player2_id: m.team_b_player2_id || '',
            referee_name: m.referee_name || '',
          }
        })
      }
      setPlayerForm(newPlayerForm)
    }
  }

  const handleCreateMatches = async () => {
    if (!matchDetails || !matchDetails.team_b_id) {
      alert('无法创建比赛，缺少对手信息')
      return
    }
    
    for (const matchType of matchTypes) {
      await createMatch({
        team_match_id: matchDetails.team_match_id,
        match_type_id: matchType.match_type_id,
      })
    }
    
    loadMatchDetails(matchDetails.team_match_id)
  }

  const handleUpdatePlayers = async (matchId) => {
    const form = playerForm[matchId]
    if (!form) return
    
    try {
      await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      loadMatchDetails(matchDetails.team_match_id)
      alert('选手信息已保存')
    } catch (error) {
      alert('保存失败: ' + error.message)
    }
  }

  const getMatchWinner = (match) => {
    const games = [
      { a: match.game1_score_a, b: match.game1_score_b },
      { a: match.game2_score_a, b: match.game2_score_b },
      { a: match.game3_score_a, b: match.game3_score_b },
    ]
    
    let winsA = 0, winsB = 0
    for (const game of games) {
      if (game.a >= 21 || game.b >= 21) {
        if (Math.abs(game.a - game.b) >= 2 || game.a === 30 || game.b === 30) {
          if (game.a > game.b) winsA++
          else if (game.b > game.a) winsB++
        }
      }
    }
    
    if (winsA >= 2) return 'A'
    if (winsB >= 2) return 'B'
    return null
  }

  const isGameComplete = (scoreA, scoreB) => {
    if (scoreA >= 21 || scoreB >= 21) {
      if (Math.abs(scoreA - scoreB) >= 2 || scoreA === 30 || scoreB === 30) {
        return true
      }
    }
    return false
  }

  const validateScore = (scoreA, scoreB) => {
    if (scoreA === 0 && scoreB === 0) return { valid: true }
    
    if (scoreA < 0 || scoreB < 0 || scoreA > 30 || scoreB > 30) {
      return { valid: false, message: '比分必须在0-30之间' }
    }
    
    if (scoreA === scoreB && scoreA >= 29) {
      return { valid: false, message: '比分不能相同（决胜分必须有一方领先）' }
    }
    
    const maxScore = Math.max(scoreA, scoreB)
    const minScore = Math.min(scoreA, scoreB)
    const diff = maxScore - minScore
    
    if (maxScore < 21) {
      return { valid: true, incomplete: true, message: '比赛尚未结束（需达到21分）' }
    }
    
    if (maxScore === 21) {
      if (minScore > 19) {
        return { valid: false, message: `比分${scoreA}:${scoreB}不合理，21分获胜时对手得分不能超过19分` }
      }
      return { valid: true, complete: true }
    }
    
    if (maxScore >= 22 && maxScore <= 29) {
      if (diff !== 2) {
        return { valid: false, message: `比分${scoreA}:${scoreB}不合理，超过21分时必须领先2分才能获胜` }
      }
      if (minScore < 20) {
        return { valid: false, message: `比分${scoreA}:${scoreB}不合理，延长期比分应从20平开始` }
      }
      return { valid: true, complete: true }
    }
    
    if (maxScore === 30) {
      if (minScore !== 29) {
        return { valid: false, message: `比分${scoreA}:${scoreB}不合理，30分封顶时对手应为29分` }
      }
      return { valid: true, complete: true }
    }
    
    return { valid: true, incomplete: true }
  }

  const getGameWinner = (scoreA, scoreB) => {
    if (!isGameComplete(scoreA, scoreB)) return null
    return scoreA > scoreB ? 'A' : 'B'
  }

  const showSaveMessage = (type, text) => {
    setSaveMessage({ type, text })
    setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000)
  }

  const handleScoreSubmit = async (matchId) => {
    const match = matchDetails.matches.find(m => m.match_id === matchId)
    if (!match) return
    
    const form = playerForm[matchId]
    if (form) {
      const hasPlayers = form.team_a_player1_id || form.team_a_player2_id || form.team_b_player1_id || form.team_b_player2_id
      if (hasPlayers) {
        try {
          await fetch(`/api/matches/${matchId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
          })
        } catch (error) {
          showSaveMessage('error', '选手信息保存失败: ' + error.message)
          return
        }
      }
    }
    
    const games = [
      { a: scoreForm.game1_score_a, b: scoreForm.game1_score_b, label: '第一局' },
      { a: scoreForm.game2_score_a, b: scoreForm.game2_score_b, label: '第二局' },
      { a: scoreForm.game3_score_a, b: scoreForm.game3_score_b, label: '第三局' },
    ]
    
    for (const game of games) {
      if (game.a > 0 || game.b > 0) {
        const validation = validateScore(game.a, game.b)
        if (!validation.valid) {
          showSaveMessage('error', `${game.label} ${validation.message}`)
          return
        }
      }
    }
    
    const game1Complete = isGameComplete(games[0].a, games[0].b)
    const game2Complete = isGameComplete(games[1].a, games[1].b)
    const game1Winner = game1Complete ? (games[0].a > games[0].b ? 'A' : 'B') : null
    const game2Winner = game2Complete ? (games[1].a > games[1].b ? 'A' : 'B') : null
    
    if (game1Complete && game2Complete && game1Winner === game2Winner) {
      if (games[2].a > 0 || games[2].b > 0) {
        showSaveMessage('error', '前两局已分出胜负，无需进行第三局比赛')
        return
      }
    }
    
    let winsA = 0, winsB = 0
    let completedGames = 0
    
    for (let i = 0; i < games.length; i++) {
      const game = games[i]
      if (isGameComplete(game.a, game.b)) {
        completedGames++
        if (game.a > game.b) winsA++
        else winsB++
      }
    }
    
    if (completedGames < 2 || (winsA < 2 && winsB < 2)) {
      showSaveMessage('error', '比赛尚未完成，请确保至少有两局比赛结束并有一方获胜')
      return
    }
    
    try {
      await updateMatchScore(matchId, scoreForm)
      loadMatchDetails(matchDetails.team_match_id)
      showSaveMessage('success', '比分已保存')
    } catch (error) {
      showSaveMessage('error', '保存失败: ' + error.message)
    }
  }

  const handleCorrect = async (matchId) => {
    if (!correctReason.trim()) {
      alert('请填写修正原因')
      return
    }
    
    const games = [
      { a: scoreForm.game1_score_a, b: scoreForm.game1_score_b, label: '第一局' },
      { a: scoreForm.game2_score_a, b: scoreForm.game2_score_b, label: '第二局' },
      { a: scoreForm.game3_score_a, b: scoreForm.game3_score_b, label: '第三局' },
    ]
    
    for (const game of games) {
      if (game.a > 0 || game.b > 0) {
        const validation = validateScore(game.a, game.b)
        if (!validation.valid) {
          alert(`${game.label} ${validation.message}`)
          return
        }
      }
    }
    
    const game1Complete = isGameComplete(games[0].a, games[0].b)
    const game2Complete = isGameComplete(games[1].a, games[1].b)
    const game1Winner = game1Complete ? (games[0].a > games[0].b ? 'A' : 'B') : null
    const game2Winner = game2Complete ? (games[1].a > games[1].b ? 'A' : 'B') : null
    
    if (game1Complete && game2Complete && game1Winner === game2Winner) {
      if (games[2].a > 0 || games[2].b > 0) {
        alert('前两局已分出胜负，无需进行第三局比赛')
        return
      }
    }
    
    try {
      await correctMatchScore(matchId, { ...scoreForm, correction_reason: correctReason })
      loadMatchDetails(matchDetails.team_match_id)
      setShowCorrectForm(false)
      setCorrectReason('')
      alert('比分已修正')
    } catch (error) {
      alert('修正失败: ' + error.message)
    }
  }

  const loadMatchScore = (match) => {
    setScoreForm({
      game1_score_a: match.game1_score_a || 0,
      game1_score_b: match.game1_score_b || 0,
      game2_score_a: match.game2_score_a || 0,
      game2_score_b: match.game2_score_b || 0,
      game3_score_a: match.game3_score_a || 0,
      game3_score_b: match.game3_score_b || 0,
    })
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

  const getGameStatus = (scoreA, scoreB) => {
    if (!scoreA && !scoreB) return '未开始'
    return isGameComplete(scoreA, scoreB) ? '已结束' : '进行中'
  }

  const getRequiredGender = (typeName) => {
    if (typeName?.includes('男子')) return '男'
    if (typeName?.includes('女子')) return '女'
    return null
  }

  const getAvailablePlayers = (players, matchId, playerKey, currentMatch) => {
    const requiredGender = getRequiredGender(currentMatch.type_name)
    let filteredPlayers = players
    
    if (requiredGender) {
      filteredPlayers = players.filter(p => p.gender === requiredGender)
    }
    
    const usedPlayerIds = new Set()
    if (matchDetails.matches) {
      matchDetails.matches.forEach(m => {
        if (m.match_id !== matchId) {
          const form = playerForm[m.match_id]
          if (form) {
            if (form.team_a_player1_id) usedPlayerIds.add(String(form.team_a_player1_id))
            if (form.team_a_player2_id) usedPlayerIds.add(String(form.team_a_player2_id))
            if (form.team_b_player1_id) usedPlayerIds.add(String(form.team_b_player1_id))
            if (form.team_b_player2_id) usedPlayerIds.add(String(form.team_b_player2_id))
          }
          if (m.team_a_player1_id) usedPlayerIds.add(String(m.team_a_player1_id))
          if (m.team_a_player2_id) usedPlayerIds.add(String(m.team_a_player2_id))
          if (m.team_b_player1_id) usedPlayerIds.add(String(m.team_b_player1_id))
          if (m.team_b_player2_id) usedPlayerIds.add(String(m.team_b_player2_id))
        }
      })
    }
    
    const currentForm = playerForm[matchId] || {}
    const currentSelectedId = currentForm[playerKey]
    
    return filteredPlayers.filter(p => 
      !usedPlayerIds.has(String(p.player_id)) || String(p.player_id) === currentSelectedId
    )
  }

  const formatScore = (match) => {
    const scores = []
    if (match.game1_score_a || match.game1_score_b) {
      scores.push(`${match.game1_score_a}:${match.game1_score_b}`)
    }
    if (match.game2_score_a || match.game2_score_b) {
      scores.push(`${match.game2_score_a}:${match.game2_score_b}`)
    }
    if (match.game3_score_a || match.game3_score_b) {
      scores.push(`${match.game3_score_a}:${match.game3_score_b}`)
    }
    return scores.join(' / ')
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
      <h2 className="text-2xl font-bold text-gray-800">比赛记录</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">团体赛列表</h3>
          {teamMatches.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无比赛，请先在赛程安排中生成对阵表</p>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
              {teamMatches.map(match => (
                <div
                  key={match.team_match_id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedMatch?.team_match_id === match.team_match_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {match.team_a_name} vs {match.team_b_name || '轮空'}
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {getRoundName(match.round_number)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(match.status)}`}>
                      {match.status}
                    </span>
                    {match.winner_team_name && (
                      <span className="text-green-600 text-xs">胜: {match.winner_team_name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card lg:col-span-2">
          {saveMessage.text && (
            <div className={`mb-4 p-3 rounded-lg ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {saveMessage.type === 'success' ? '✓ ' : '✕ '}{saveMessage.text}
            </div>
          )}
          {selectedMatch ? (
            matchDetails ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {matchDetails.team_a_name} vs {matchDetails.team_b_name || '轮空'}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(matchDetails.status)}`}>
                    {matchDetails.status}
                  </span>
                </div>

                {matchDetails.team_b_id && matchDetails.matches?.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">尚未创建单项比赛</p>
                    <button onClick={handleCreateMatches} className="btn btn-primary">
                      创建5场单项比赛
                    </button>
                  </div>
                )}

                {matchDetails.matches?.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mb-4">
                    <h4 className="text-center text-sm text-gray-600 mb-3">实时比分</h4>
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-800">{matchDetails.team_a_name}</div>
                        <div className="text-4xl font-bold text-blue-600 mt-1">
                          {matchDetails.matches ? matchDetails.matches.filter(m => getMatchWinner(m) === 'A').length : 0}
                        </div>
                      </div>
                      <div className="text-2xl text-gray-400 font-light">VS</div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-indigo-800">{matchDetails.team_b_name}</div>
                        <div className="text-4xl font-bold text-indigo-600 mt-1">
                          {matchDetails.matches ? matchDetails.matches.filter(m => getMatchWinner(m) === 'B').length : 0}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-center gap-4 text-sm">
                      {matchDetails.matches && matchDetails.matches.map((m, idx) => {
                        const winner = getMatchWinner(m)
                        const shortName = m.type_name?.includes('男子双打') ? '男双' 
                          : m.type_name?.includes('女子双打') ? '女双'
                          : m.type_name?.includes('男子单打') ? '男单'
                          : m.type_name?.includes('女子单打') ? '女单'
                          : m.type_name?.includes('混合双打') ? '混双'
                          : m.type_name?.substring(0, 2)
                        return (
                          <div key={m.match_id} className="text-center">
                            <div className={`px-3 py-1 rounded ${winner === 'A' ? 'bg-blue-200 text-blue-800' : winner === 'B' ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-600'}`}>
                              {shortName}
                              {winner && (winner === 'A' ? ' ✓A' : ' ✓B')}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {matchDetails.matches?.length > 0 ? (
                  <div>
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {matchDetails.matches.map((match, index) => {
                        const winner = getMatchWinner(match)
                        const score = formatScore(match)
                        return (
                          <button
                            key={match.match_id}
                            onClick={() => {
                              setCurrentMatchIndex(index)
                              loadMatchScore(match)
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                              currentMatchIndex === index
                                ? 'bg-blue-600 text-white'
                                : winner
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {index + 1}. {match.type_name}
                            {winner && <span className="ml-1">✓</span>}
                          </button>
                        )
                      })}
                    </div>

                    {(() => {
                      const match = matchDetails.matches[currentMatchIndex]
                      if (!match) return null
                      const form = playerForm[match.match_id] || {}
                      const winner = getMatchWinner(match)
                      const isDoubles = match.type_name?.includes('双')
                      const requiredGender = getRequiredGender(match.type_name)
                      
                      return (
                        <div className="space-y-4">
                          {match.status === '已结束' && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-green-700 font-medium">
                                    🏆 {winner === 'A' ? matchDetails.team_a_name : matchDetails.team_b_name} 获胜
                                  </span>
                                </div>
                                <div className="text-green-600 font-medium">
                                  比分: {formatScore(match)}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-3">{match.type_name} - 选手设置
                              {requiredGender && (
                                <span className="ml-2 text-sm text-blue-600">
                                  (需{requiredGender}选手)
                                </span>
                              )}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">{matchDetails.team_a_name}</label>
                                <div className="space-y-2">
                                  <select
                                    value={form.team_a_player1_id || ''}
                                    onChange={(e) => setPlayerForm({
                                      ...playerForm,
                                      [match.match_id]: { ...form, team_a_player1_id: e.target.value }
                                    })}
                                    className="input"
                                  >
                                    <option value="">选择选手1</option>
                                    {getAvailablePlayers(teamPlayers.a, match.match_id, 'team_a_player1_id', match).map(p => (
                                      <option key={p.player_id} value={p.player_id}>
                                        {p.player_name} ({p.gender})
                                      </option>
                                    ))}
                                  </select>
                                  {isDoubles && (
                                    <select
                                      value={form.team_a_player2_id || ''}
                                      onChange={(e) => setPlayerForm({
                                        ...playerForm,
                                        [match.match_id]: { ...form, team_a_player2_id: e.target.value }
                                      })}
                                      className="input"
                                    >
                                      <option value="">选择选手2</option>
                                      {getAvailablePlayers(teamPlayers.a, match.match_id, 'team_a_player2_id', match)
                                        .filter(p => p.player_id != form.team_a_player1_id)
                                        .map(p => (
                                          <option key={p.player_id} value={p.player_id}>
                                            {p.player_name} ({p.gender})
                                          </option>
                                        ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">{matchDetails.team_b_name}</label>
                                <div className="space-y-2">
                                  <select
                                    value={form.team_b_player1_id || ''}
                                    onChange={(e) => setPlayerForm({
                                      ...playerForm,
                                      [match.match_id]: { ...form, team_b_player1_id: e.target.value }
                                    })}
                                    className="input"
                                  >
                                    <option value="">选择选手1</option>
                                    {getAvailablePlayers(teamPlayers.b, match.match_id, 'team_b_player1_id', match).map(p => (
                                      <option key={p.player_id} value={p.player_id}>
                                        {p.player_name} ({p.gender})
                                      </option>
                                    ))}
                                  </select>
                                  {isDoubles && (
                                    <select
                                      value={form.team_b_player2_id || ''}
                                      onChange={(e) => setPlayerForm({
                                        ...playerForm,
                                        [match.match_id]: { ...form, team_b_player2_id: e.target.value }
                                      })}
                                      className="input"
                                    >
                                      <option value="">选择选手2</option>
                                      {getAvailablePlayers(teamPlayers.b, match.match_id, 'team_b_player2_id', match)
                                        .filter(p => p.player_id != form.team_b_player1_id)
                                        .map(p => (
                                          <option key={p.player_id} value={p.player_id}>
                                            {p.player_name} ({p.gender})
                                          </option>
                                        ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <label className="block text-sm text-gray-600 mb-1">裁判</label>
                              <input
                                type="text"
                                value={form.referee_name || ''}
                                onChange={(e) => setPlayerForm({
                                  ...playerForm,
                                  [match.match_id]: { ...form, referee_name: e.target.value }
                                })}
                                className="input max-w-xs"
                                placeholder="裁判姓名"
                              />
                            </div>
                            <button
                              onClick={() => handleUpdatePlayers(match.match_id)}
                              className="btn btn-secondary mt-3"
                            >
                              保存选手信息
                            </button>
                          </div>

                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-3">比分录入</h4>
                            
                            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                              <div className="font-medium">{matchDetails.team_a_name}</div>
                              <div className="text-gray-500">局数</div>
                              <div className="font-medium">{matchDetails.team_b_name}</div>
                            </div>

                            {[
                              { label: '第一局', a: 'game1_score_a', b: 'game1_score_b' },
                              { label: '第二局', a: 'game2_score_a', b: 'game2_score_b' },
                              { label: '第三局', a: 'game3_score_a', b: 'game3_score_b' },
                            ].map((game, gi) => {
                              const status = getGameStatus(scoreForm[game.a], scoreForm[game.b])
                              const gameWinner = getGameWinner(scoreForm[game.a], scoreForm[game.b])
                              const validation = validateScore(scoreForm[game.a], scoreForm[game.b])
                              const hasError = !validation.valid
                              
                              const game1Complete = isGameComplete(scoreForm.game1_score_a, scoreForm.game1_score_b)
                              const game2Complete = isGameComplete(scoreForm.game2_score_a, scoreForm.game2_score_b)
                              const game1Winner = game1Complete ? (scoreForm.game1_score_a > scoreForm.game1_score_b ? 'A' : 'B') : null
                              const game2Winner = game2Complete ? (scoreForm.game2_score_a > scoreForm.game2_score_b ? 'A' : 'B') : null
                              const matchDecided = game1Complete && game2Complete && game1Winner === game2Winner
                              const isDisabled = gi === 2 && matchDecided
                              
                              return (
                                <div key={gi}>
                                  <div className="grid grid-cols-3 gap-2 mb-1 items-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max="30"
                                      value={scoreForm[game.a]}
                                      onChange={(e) => setScoreForm({ ...scoreForm, [game.a]: parseInt(e.target.value) || 0 })}
                                      disabled={isDisabled}
                                      className={`input text-center ${isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : hasError ? 'border-red-300 bg-red-50' : gameWinner === 'A' ? 'bg-green-50 border-green-300' : ''}`}
                                    />
                                    <div className="text-center">
                                      <span className={`${isDisabled ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{game.label}</span>
                                      {status === '已结束' && !hasError && !isDisabled && (
                                        <span className="ml-1 text-green-600 text-xs">✓</span>
                                      )}
                                    </div>
                                    <input
                                      type="number"
                                      min="0"
                                      max="30"
                                      value={scoreForm[game.b]}
                                      onChange={(e) => setScoreForm({ ...scoreForm, [game.b]: parseInt(e.target.value) || 0 })}
                                      disabled={isDisabled}
                                      className={`input text-center ${isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : hasError ? 'border-red-300 bg-red-50' : gameWinner === 'B' ? 'bg-green-50 border-green-300' : ''}`}
                                    />
                                  </div>
                                  {hasError && !isDisabled && (
                                    <div className="text-red-500 text-xs text-center mb-2">{validation.message}</div>
                                  )}
                                  {isDisabled && (
                                    <div className="text-gray-400 text-xs text-center mb-2">前两局已分出胜负，无需进行第三局</div>
                                  )}
                                </div>
                              )
                            })}

                            {winner && (
                              <div className="text-center py-3 bg-green-50 rounded-lg mb-4">
                                <span className="text-green-700 font-medium">
                                  🏆 {winner === 'A' ? matchDetails.team_a_name : matchDetails.team_b_name} 获胜
                                </span>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleScoreSubmit(match.match_id)}
                                className="btn btn-primary flex-1"
                              >
                                保存比分
                              </button>
                              {match.status === '已结束' && (
                                <button
                                  onClick={() => {
                                    setShowCorrectForm(true)
                                    loadMatchScore(match)
                                  }}
                                  className="btn btn-secondary"
                                >
                                  修正比分
                                </button>
                              )}
                            </div>

                            {showCorrectForm && (
                              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <h5 className="font-medium text-yellow-800 mb-2">比分修正</h5>
                                <textarea
                                  placeholder="请输入修正原因（必填）"
                                  value={correctReason}
                                  onChange={(e) => setCorrectReason(e.target.value)}
                                  className="input mb-3"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCorrect(match.match_id)}
                                    className="btn btn-danger flex-1"
                                  >
                                    确认修正
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowCorrectForm(false)
                                      setCorrectReason('')
                                    }}
                                    className="btn btn-secondary"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    {matchDetails.team_b_id ? '请点击上方按钮创建比赛' : '轮空队伍无需比赛'}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">加载中...</p>
            )
          ) : (
            <p className="text-gray-500 text-center py-8">请选择一场团体赛</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Matches
