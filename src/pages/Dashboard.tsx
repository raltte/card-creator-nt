import { RecrutadoraDashboard } from "@/components/RecrutadoraDashboard";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, role, signOut, isAdminMaster, isAdmin } = useAuth();
  const navigate = useNavigate();

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
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <RecrutadoraDashboard />
    </div>
  );
};

export default Dashboard;
