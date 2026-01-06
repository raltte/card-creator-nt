import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Painel from "./pages/Painel";
import Finalizar from "./pages/Finalizar";
import AtualizarLink from "./pages/AtualizarLink";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente que redireciona baseado no modo dev
const RootRedirect = () => {
  const { isDevMode, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  // Se está no modo dev, vai direto pro painel
  if (isDevMode) {
    return <Navigate to="/painel" replace />;
  }
  
  return <Navigate to="/auth" replace />;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth" element={<Auth />} />
      <Route 
        path="/painel" 
        element={
          <ProtectedRoute>
            <Painel />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/editor" 
        element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/finalizar/:id" 
        element={
          <ProtectedRoute>
            <Finalizar />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/atualizar-link/:id" 
        element={
          <ProtectedRoute>
            <AtualizarLink />
          </ProtectedRoute>
        } 
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
