import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LinkGarminPage from "./pages/LinkGarminPage";
import Dashboard from "./components/dashboard/Dashboard";

function AppRouter() {
  const { token, user } = useAuth();
  const [screen, setScreen] = useState("login"); // login | register

  // No autenticado
  if (!token || !user) {
    if (screen === "register") {
      return <RegisterPage onGoLogin={() => setScreen("login")} />;
    }
    return <LoginPage onGoRegister={() => setScreen("register")} />;
  }

  // Autenticado pero sin Garmin vinculado
  if (!user.garmin_linked) {
    return <LinkGarminPage />;
  }

  // Autenticado y Garmin vinculado
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
