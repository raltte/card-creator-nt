import { useState } from "react";
import { RecrutadoraDashboard } from "@/components/RecrutadoraDashboard";
import AssinaturaEmail from "@/pages/AssinaturaEmail";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, User, FileImage, Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const Painel = () => {
  const { user, role, signOut, isAdminMaster, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentTab = searchParams.get("tab") || "cartazes";

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleLabel = () => {
    if (role === 'admin_master') return 'Admin Master';
    if (role === 'admin') return 'Administrador';
    return 'Recrutador(a)';
  };

  const getRoleIcon = () => {
    if (isAdminMaster || isAdmin) return <Shield className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
  };

  const tabs = [
    { id: "cartazes", label: "Gerador de Cartazes", icon: FileImage },
    { id: "assinatura", label: "Assinatura de E-mail", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getRoleIcon()}
            <div>
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b bg-background/80">
        <div className="max-w-5xl mx-auto px-6">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  currentTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      {currentTab === "cartazes" && <RecrutadoraDashboard />}
      {currentTab === "assinatura" && <AssinaturaEmail />}
    </div>
  );
};

export default Painel;
