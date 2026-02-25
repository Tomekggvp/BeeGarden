import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthForm = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          {isSignUp ? 'Регистрация' : 'Вход в BeeGarden'}
        </h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:border-yellow-400"
            type="email"
            placeholder="Ваш Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:border-yellow-400"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 font-bold py-4 rounded-xl transition-all"
          >
            {loading ? 'Секунду...' : isSignUp ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;