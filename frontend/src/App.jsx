import { useState, useEffect } from 'react'

function App() {
  const [user, setUser] = useState(null)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [tasks, setTasks] = useState([])
  const [newTaskName, setNewTaskName] = useState('')
  const [recurrenceType, setRecurrenceType] = useState('dni')
  const [recurrenceValue, setRecurrenceValue] = useState('1')
  const [selectedDays, setSelectedDays] = useState([])

  const API_BASE_URL = `http://${import.meta.env.VITE_API_HOST || 'localhost'}:8000`

  const daysOfWeek = [
    { id: 0, name: 'Pon' }, { id: 1, name: 'Wt' }, { id: 2, name: 'Śr' },
    { id: 3, name: 'Czw' }, { id: 4, name: 'Pt' }, { id: 5, name: 'Sob' }, { id: 6, name: 'Ndz' }
  ]

  const fetchTasks = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/tasks/today`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (error) {}
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setErrorMsg('')

    if (!isLoginMode) {
      if (password !== confirmPassword) {
        setErrorMsg('Hasła nie są identyczne!')
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_BASE_URL}/users/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        })
        if (res.ok) {
          setIsLoginMode(true)
          setStep(1)
          setPassword('')
          setConfirmPassword('')
          setErrorMsg('Konto utworzone! Możesz się zalogować.')
        } else {
          const data = await res.json()
          setErrorMsg(data.detail)
        }
      } catch (error) { setErrorMsg("Błąd serwera") }
      finally { setLoading(false) }
    } else if (isLoginMode && step === 1) {
      try {
        const res = await fetch(`${API_BASE_URL}/request-login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })
        if (res.ok) {
          setStep(2)
          setErrorMsg('')
        } else {
          const data = await res.json()
          setErrorMsg(data.detail)
        }
      } catch (error) { setErrorMsg("Błąd serwera") }
      finally { setLoading(false) }
    } else if (isLoginMode && step === 2) {
      try {
        const res = await fetch(`${API_BASE_URL}/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, otp_code: otpCode })
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data)
          fetchTasks(data.id)
        } else {
          const data = await res.json()
          setErrorMsg(data.detail)
        }
      } catch (error) { setErrorMsg("Błąd serwera") }
      finally { setLoading(false) }
    }
  }

  const handleDayToggle = (dayId) => {
    setSelectedDays(prev => prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId])
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskName) return
    let val = recurrenceValue
    if (recurrenceType === 'dni_tygodnia') val = selectedDays.sort().join(',')
    
    await fetch(`${API_BASE_URL}/users/${user.id}/tasks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newTaskName,
        recurrence_type: recurrenceType,
        recurrence_value: val.toString(),
        next_due_date: new Date().toISOString().split('T')[0]
      })
    })
    setNewTaskName('')
    fetchTasks(user.id)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <form onSubmit={handleAuth} className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-blue-400">{isLoginMode ? 'Logowanie' : 'Rejestracja'}</h2>
          {errorMsg && <p className={`${errorMsg.includes('Konto utworzone') ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'} mb-4 p-3 rounded text-sm`}>{errorMsg}</p>}
          
          {(!isLoginMode || (isLoginMode && step === 1)) && (
            <>
              <input type="text" placeholder="Użytkownik" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-gray-700 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500" />
              {!isLoginMode && <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-700 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500" />}
              <input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-700 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500" />
              {!isLoginMode && <input type="password" placeholder="Powtórz hasło" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-gray-700 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500" />}
            </>
          )}

          {isLoginMode && step === 2 && (
            <input type="text" placeholder="Wpisz 6-cyfrowy PIN z maila" value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-gray-700 rounded-lg p-3 mb-6 text-center text-xl tracking-widest outline-none focus:ring-2 focus:ring-blue-500" />
          )}

          <button type="submit" disabled={loading} className={`${loading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} w-full py-3 rounded-lg font-bold transition`}>
            {loading ? 'Wysyłanie...' : (!isLoginMode ? 'Zarejestruj' : (step === 1 ? 'Wyślij PIN' : 'Zaloguj'))}
          </button>
          
          <button type="button" disabled={loading} onClick={() => { setIsLoginMode(!isLoginMode); setStep(1); setErrorMsg(''); }} className="w-full mt-4 text-sm text-gray-400 hover:text-white underline">
            {isLoginMode ? 'Stwórz konto' : 'Masz już konto?'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 text-white">
      <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
        <h1 className="text-2xl font-bold text-blue-400">Moje Rutyny</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Witaj, {user.username}</span>
          <button onClick={() => { setUser(null); setStep(1); setOtpCode(''); }} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition">Wyloguj</button>
        </div>
      </div>

      <form onSubmit={handleAddTask} className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 space-y-4 border border-gray-700">
        <input type="text" placeholder="Co robimy?" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} className="w-full bg-gray-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex gap-4">
          <select value={recurrenceType} onChange={e => setRecurrenceType(e.target.value)} className="flex-1 bg-gray-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="dni">Dni</option>
            <option value="miesiace">Miesiące</option>
            <option value="dni_tygodnia">Dni tygodnia</option>
          </select>
          {(recurrenceType !== 'dni_tygodnia') && <input type="number" min="1" value={recurrenceValue} onChange={e => setRecurrenceValue(e.target.value)} className="w-24 bg-gray-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" />}
        </div>
        {recurrenceType === 'dni_tygodnia' && (
          <div className="flex gap-2 flex-wrap">
            {daysOfWeek.map(d => <button key={d.id} type="button" onClick={() => handleDayToggle(d.id)} className={`px-3 py-2 rounded-lg text-xs transition ${selectedDays.includes(d.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>{d.name}</button>)}
          </div>
        )}
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold transition">Dodaj</button>
      </form>

      <div className="space-y-4">
        {tasks.map(t => (
          <div key={t.id} className="bg-gray-800 p-5 rounded-xl flex justify-between items-center border border-gray-700 hover:border-gray-600 transition shadow-lg">
            <div>
              <p className="font-bold text-lg">{t.name}</p>
              <p className="text-sm text-gray-400 mt-1">{t.recurrence_type} ({t.recurrence_value})</p>
            </div>
            <button onClick={() => fetch(`${API_BASE_URL}/tasks/${t.id}/done`, {method: 'PUT'}).then(() => fetchTasks(user.id))} className="bg-green-600 hover:bg-green-500 w-12 h-12 rounded-full flex items-center justify-center transition text-xl">✓</button>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-gray-500 text-center mt-8">Brak zadań na dziś. Odpoczywaj szefie!</p>}
      </div>
    </div>
  )
}

export default App