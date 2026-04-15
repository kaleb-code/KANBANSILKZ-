import { useState, useEffect, useCallback } from 'react';
import '@/App.css';
import { authApi, pedidosApi } from '@/api';
import LoginPage from '@/components/LoginPage';
import KanbanBoard from '@/components/KanbanBoard';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        await authApi.verify();
        if (!cancelled) setAuthenticated(true);
      } catch {
        // not authenticated - stay on login
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    checkAuth();
    return () => { cancelled = true; };
  }, []);

  const loadPedidos = useCallback(async () => {
    try {
      const res = await pedidosApi.getAll();
      setPedidos(res.data);
    } catch {
      // handled by interceptor
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadPedidos();
    }
  }, [authenticated, loadPedidos]);

  const handleLogin = useCallback(() => {
    setAuthenticated(true);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // cookie may already be gone
    }
    setAuthenticated(false);
    setPedidos([]);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]" data-testid="loading-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm font-body text-[#635F59]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <KanbanBoard
      pedidos={pedidos}
      setPedidos={setPedidos}
      onRefresh={loadPedidos}
      onLogout={handleLogout}
    />
  );
}

export default App;
