// components/Auth.tsx
"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async () => {
    setError(null)
    let res
    if (isSignUp) {
      res = await supabase.auth.signUp({ email, password })
    } else {
      res = await supabase.auth.signInWithPassword({ email, password })
    }

    if (res.error) {
      setError(res.error.message)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <div className="bg-zinc-900 p-10 rounded-3xl w-96 text-white">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {isSignUp ? 'Регистрация' : 'Вход'}
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-zinc-800 p-4 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-zinc-800 p-4 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <button
          onClick={handleAuth}
          className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-medium"
        >
          {isSignUp ? 'Зарегистрироваться' : 'Войти'}
        </button>

        <p className="text-center mt-4 text-zinc-400">
          {isSignUp ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 ml-2 hover:underline"
          >
            {isSignUp ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </p>
      </div>
    </div>
  )
}