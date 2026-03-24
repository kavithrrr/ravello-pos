"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default Password: ravello123
    if (password === 'ravello123') {
      localStorage.setItem('isAdmin', 'true');
      router.push('/dashboard');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-zinc-900/50 p-10 rounded-[2.5rem] border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black italic text-red-600 tracking-tighter uppercase">RAVELLO <span className="text-white">DASHBOARD</span></h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-2">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 text-center">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Access Key</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full mt-2 bg-black border ${error ? 'border-red-600' : 'border-zinc-800'} text-white p-4 rounded-2xl focus:outline-none focus:border-red-600 transition-all text-center tracking-[0.5em] font-bold`}
            />
          </div>
          
          <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95 uppercase text-sm tracking-widest">
            UNLOCK SYSTEM
          </button>
        </form>

        {error && (
          <p className="text-red-600 text-[10px] font-black uppercase tracking-widest text-center mt-6 animate-pulse">
            Invalid Access Key. Access Denied.
          </p>
        )}
      </div>
    </div>
  );
}