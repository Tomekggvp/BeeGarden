import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthForm = () => {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleAuth = async (event) => {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setErrorMessage('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setErrorMessage('Не удалось войти. Проверьте email и пароль.')
    } catch {
      setErrorMessage('Не удалось связаться с сервером. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.14)]">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#f8b400]/35 bg-[#fffaf0] px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9a5a00]">
            <span className="h-2 w-2 rounded-full bg-[#f8b400]"></span>
            BeeGarden
          </div>
          <h1 className="font-['Rubik'] text-5xl leading-none text-[#2f2100]">
            Вход
          </h1>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            className="w-full rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-4 font-semibold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
            type="email"
            autoComplete="username"
            aria-label="Email"
            placeholder="Ваш Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-4 font-semibold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
            type="password"
            autoComplete="current-password"
            aria-label="Пароль"
            placeholder="Пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {errorMessage && <p role="alert" className="text-sm font-semibold text-red-700">{errorMessage}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg primary-action py-4 font-black   transition-all  active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Подождите...' : 'Войти'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default AuthForm
