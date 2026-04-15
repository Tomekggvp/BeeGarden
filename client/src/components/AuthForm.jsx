import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthForm = () => {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (event) => {
    event.preventDefault()
    setLoading(true)

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) alert(error.message)
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-[#f1d88a] bg-[#fffdf7] p-6 shadow-[0_24px_70px_rgba(93,58,0,0.14)]">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#f8b400]/35 bg-[#fffaf0] px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9a5a00]">
            <span className="h-2 w-2 rounded-full bg-[#f8b400]"></span>
            BeeGarden
          </div>
          <h1 className="font-['Tenor_Sans'] text-5xl leading-none text-[#2f2100]">
            {isSignUp ? 'Регистрация' : 'Вход'}
          </h1>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            className="w-full rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-4 font-semibold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
            type="email"
            placeholder="Ваш Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border-2 border-[#f1d88a] bg-white px-4 py-4 font-semibold text-[#2f2100] outline-none transition-all focus:border-[#f8b400] focus:ring-4 focus:ring-[#f8b400]/20"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#f8b400] py-4 font-black text-[#2b1a00] shadow-sm transition-all hover:bg-[#ffd24a] active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Подождите...' : isSignUp ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 w-full rounded-lg border border-[#f1d88a] px-6 py-3 text-sm font-bold text-[#7a5a1a] transition-colors hover:bg-[#fff4cc]"
        >
          {isSignUp ? 'Уже есть аккаунт? Войти' : 'Создать аккаунт'}
        </button>
      </div>
    </main>
  )
}

export default AuthForm
