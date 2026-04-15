import { useState } from 'react';
import { Lock, Eye, EyeSlash } from '@phosphor-icons/react';
import { authApi } from '@/api';

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(password);
      onLogin();
    } catch {
      setError('Senha incorreta');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1773525912476-213bff96b8a4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxzaWxrJTIwc2NyZWVuJTIwcHJpbnRpbmclMjBmYWN0b3J5fGVufDB8fHx8MTc3NjI1NjEzN3ww&ixlib=rb-4.1.0&q=85"
          alt="Silk screen printing"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <h1 className="font-heading text-4xl font-bold text-white tracking-tight">
            SilkZe Kanban
          </h1>
          <p className="mt-2 text-white/80 text-lg font-body">
            Gestao de producao inteligente
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDFBF7]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-10">
            <h1 className="font-heading text-3xl font-bold text-[#1A1714] tracking-tight">
              SilkZe
            </h1>
            <p className="text-[#635F59] font-body mt-1">Kanban de Producao</p>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-[#635F59] font-body">
                Acesso Restrito
              </p>
              <h2 className="font-heading text-2xl font-bold text-[#1A1714] tracking-tight mt-1">
                Entrar no sistema
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs tracking-[0.2em] uppercase text-[#635F59] font-body block mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A39F97]" size={20} />
                  <input
                    data-testid="login-password-input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha"
                    className="w-full pl-10 pr-12 py-3 bg-white border border-[#EBE8E1] rounded-md text-[#1A1714] font-body placeholder:text-[#A39F97] focus:outline-none focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] transition-colors"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A39F97] hover:text-[#635F59] transition-colors"
                    data-testid="toggle-password-visibility"
                  >
                    {showPass ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 font-body" data-testid="login-error">
                  {error}
                </p>
              )}

              <button
                data-testid="login-submit-button"
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 bg-[#FF5C00] hover:bg-[#E65300] text-white font-heading font-semibold rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
