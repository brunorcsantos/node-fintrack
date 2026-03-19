// src/App.tsx
import { useAuth } from "./context/AuthContext";
import Auth from "./views/Auth";
import AuthenticatedApp from "./components/AutheticatedApp";
import LoadingSpinner from "./components/LoadingSpinner";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner message="Iniciando..." />;
  if (!user) return <Auth />;

  return <AuthenticatedApp />;
}