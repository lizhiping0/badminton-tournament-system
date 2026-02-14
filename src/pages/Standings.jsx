import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import * as XLSX from 'xlsx'

function Standings() {
  const { currentEvent, standings, fetchStandings, calculateStandings } = useStore()
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState({})
  const [message, setMessage] = useState({ type: '', text: '' })

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  useEffect(() => {
    if (currentEvent) {
      fetchStandings(currentEvent.event_id)
    }
  }, [currentEvent])

  const handleCalculate = async () => {
    if (!currentEvent) return
    setLoading(true)
    try {
      await calculateStandings(currentEvent.event_id)
      showMessage('success', '成绩统计完成！')
    } catch (error) {
      showMessage('error', '统计失败: ' + error.message)
    }
    setLoading(false)
  }

  const handleExportStandings = () => {
    if (standings.length === 0) {
      showMessage('error', '暂无数据可导出')
      return
    }

    const data = standings.map((s, index) => ({
      '排名': s.ranking || index + 1,
      '队伍': s.team_name,
      '积分': s.total_points,
      '胜场': s.matches_won,
      '负场': s.matches_lost,
      '胜局': s.games_won,
      '负局': s.games_lost,
      '净胜局': s.games_won - s.games_lost,
      '得分': s.points_won,
      '失分': s.points_lost,
      '净胜分': s.points_won - s.points_lost,
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '成绩统计')
    XLSX.writeFile(wb, `${currentEvent?.event_name || '成绩统计'}_积分榜.xlsx`)
  }

  const handleExportSchedule = async () => {
    if (!currentEvent) return
    setExportLoading({ ...exportLoading, schedule: true })
    try {
      const res = await fetch(`/api/export/schedule/${currentEvent.event_id}`)
      const data = await res.json()
      
      if (!data.teamMatches || data.teamMatches.length === 0) {
        showMessage('error', '暂无赛程数据')
        return
      }

      const scheduleData = data.teamMatches.map((m, i) => ({
        '场次': i + 1,
        '轮次': getRoundName(m.round_number),
        '队伍A': m.team_a_name || '待定',
        '队伍B': m.team_b_name || '轮空',
        '比赛时间': m.match_time ? new Date(m.match_time).toLocaleString('zh-CN') : '-',
        '场地': m.venue || '-',
        '状态': m.status,
        '胜者': m.winner_team_name || '-',
      }))

      const ws = XLSX.utils.json_to_sheet(scheduleData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '赛程表')
      XLSX.writeFile(wb, `${currentEvent.event_name}_赛程表.xlsx`)
    } catch (error) {
      showMessage('error', '导出失败: ' + error.message)
    }
    setExportLoading({ ...exportLoading, schedule: false })
  }

  const handleExportMatches = async () => {
    if (!currentEvent) return
    setExportLoading({ ...exportLoading, matches: true })
    try {
      const res = await fetch(`/api/export/matches/${currentEvent.event_id}`)
      const data = await res.json()
      
      if (!data.matches || data.matches.length === 0) {
        showMessage('error', '暂无比赛数据')
        return
      }

      const matchData = []
      data.matches.forEach((tm, i) => {
        if (tm.matchDetails && tm.matchDetails.length > 0) {
          tm.matchDetails.forEach((m, j) => {
            matchData.push({
              '团体赛': `${tm.team_a_name} vs ${tm.team_b_name || '轮空'}`,
              '单项': m.type_name,
              '选手A': [m.team_a_player1_name, m.team_a_player2_name].filter(Boolean).join(' / '),
              '选手B': [m.team_b_player1_name, m.team_b_player2_name].filter(Boolean).join(' / '),
              '第一局': `${m.game1_score_a || 0} : ${m.game1_score_b || 0}`,
              '第二局': `${m.game2_score_a || 0} : ${m.game2_score_b || 0}`,
              '第三局': m.game3_score_a || m.game3_score_b ? `${m.game3_score_a || 0} : ${m.game3_score_b || 0}` : '-',
              '胜者': m.winner_team_name || '-',
              '裁判': m.referee_name || '-',
            })
          })
        }
      })

      if (matchData.length === 0) {
        showMessage('error', '暂无比赛详细数据')
        return
      }

      const ws = XLSX.utils.json_to_sheet(matchData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '比赛记录')
      XLSX.writeFile(wb, `${currentEvent.event_name}_比赛记录.xlsx`)
    } catch (error) {
      showMessage('error', '导出失败: ' + error.message)
    }
    setExportLoading({ ...exportLoading, matches: false })
  }

  const getRoundName = (round) => {
    const names = { 1: '第一轮', 2: '第二轮', 3: '半决赛', 4: '决赛' }
    return names[round] || `第${round}轮`
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
      {message.text && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? '✓ ' : '✕ '}{message.text}
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-800">成绩统计</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? '统计中...' : '📊 计算成绩'}
          </button>
          <button
            onClick={handleExportStandings}
            disabled={standings.length === 0}
            className="btn btn-secondary"
          >
            📥 导出积分榜
          </button>
          <button
            onClick={handleExportSchedule}
            disabled={exportLoading.schedule}
            className="btn btn-secondary"
          >
            {exportLoading.schedule ? '导出中...' : '📥 导出赛程表'}
          </button>
          <button
            onClick={handleExportMatches}
            disabled={exportLoading.matches}
            className="btn btn-secondary"
          >
            {exportLoading.matches ? '导出中...' : '📥 导出比赛记录'}
          </button>
        </div>
      </div>

      <div className="card">
        {standings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">暂无成绩数据</p>
            <p className="text-sm text-gray-400">请先完成比赛记录，然后点击"计算成绩"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50">排名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">队伍</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50">积分</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50">胜场</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50">负场</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50">胜局</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50">负局</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50">净胜局</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50">得分</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50">失分</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50">净胜分</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {standings.map((s, index) => (
                  <tr key={s.standing_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        s.ranking === 1 ? 'bg-yellow-100 text-yellow-800' :
                        s.ranking === 2 ? 'bg-gray-200 text-gray-800' :
                        s.ranking === 3 ? 'bg-orange-100 text-orange-800' :
                        'text-gray-600'
                      }`}>
                        {s.ranking || index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.team_name}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600 text-lg">{s.total_points}</td>
                    <td className="px-4 py-3 text-center text-green-600">{s.matches_won}</td>
                    <td className="px-4 py-3 text-center text-red-600">{s.matches_lost}</td>
                    <td className="px-4 py-3 text-center">{s.games_won}</td>
                    <td className="px-4 py-3 text-center">{s.games_lost}</td>
                    <td className={`px-4 py-3 text-center font-medium ${s.games_won - s.games_lost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {s.games_won - s.games_lost > 0 ? '+' : ''}{s.games_won - s.games_lost}
                    </td>
                    <td className="px-4 py-3 text-center">{s.points_won}</td>
                    <td className="px-4 py-3 text-center">{s.points_lost}</td>
                    <td className={`px-4 py-3 text-center font-medium ${s.points_won - s.points_lost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {s.points_won - s.points_lost > 0 ? '+' : ''}{s.points_won - s.points_lost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">排名规则说明</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>1. 按积分高低排名，每场比赛胜者获得1个积分</p>
          <p>2. 积分相同情况下，依次比较：胜负关系 → 净胜局数 → 净胜分数</p>
          <p>3. 若仍相同，可进行附加赛或抽签决定</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">比赛规则说明</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>1. 每场比赛采用三局两胜制，每局21分</p>
          <p>2. 当比分达到20-20平时，需领先2分才能获胜，最高30分</p>
          <p>3. 团体赛包含5场单项比赛，先赢得3场的队伍获胜</p>
          <p>4. 单项出场顺序：男双 → 女单 → 男单 → 女双 → 混双</p>
        </div>
      </div>
    </div>
  )
}

export default Standings
