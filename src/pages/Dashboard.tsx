import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { documentHelpers, Document } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { RoleBadge } from '@/components/RoleBadge';
import { 
  FileText, 
  Upload, 
  Bell, 
  LogOut, 
  Users, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { authHelpers } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, roles, hasRole } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await documentHelpers.getDocuments();
      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast.error('Error al cargar documentos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    toast.success('Sesión cerrada');
    navigate('/auth');
  };

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending_review').length,
    approved: documents.filter(d => d.status === 'approved').length,
    changesRequested: documents.filter(d => d.status === 'changes_requested').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">EurobanSync</h1>
                <p className="text-sm text-muted-foreground">Control de Archivos Financieros</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* User Info Card */}
        <Card className="mb-6 shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bienvenido</CardTitle>
                <CardDescription className="mt-1">{user?.email}</CardDescription>
              </div>
              <div className="flex gap-2">
                {roles.map(role => (
                  <RoleBadge key={role} role={role} />
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Todos los archivos en el sistema
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Esperando revisión
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Listos para el banco
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cambios Solicitados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.changesRequested}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requieren atención
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-6 flex gap-3">
          {(hasRole('admin') || hasRole('internal_team')) && (
            <Button className="shadow-elegant">
              <Upload className="w-4 h-4 mr-2" />
              Subir Nuevo Documento
            </Button>
          )}
          {hasRole('client') && (
            <Button onClick={() => navigate('/upload')} className="shadow-elegant">
              <Upload className="w-4 h-4 mr-2" />
              Cargar Documento
            </Button>
          )}
        </div>

        {/* Documents Table */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Documentos Recientes</CardTitle>
            <CardDescription>
              Gestiona y revisa los documentos financieros
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Cargando documentos...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No hay documentos aún</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Versión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Subido por</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50 transition-smooth">
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">v{doc.current_version}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={doc.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.uploader?.full_name || 'Usuario'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(doc.created_at), { 
                          addSuffix: true,
                          locale: es 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;