import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, LogOut, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { authHelpers } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';

interface Document {
  id: string;
  title: string;
  description: string;
  status: Database['public']['Enums']['document_status'];
  current_version: number;
  created_at: string;
  uploaded_by: string;
  document_type: Database['public']['Enums']['document_type'];
  uploader?: {
    full_name: string;
  };
}

const InternalDocs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [fileData, setFileData] = useState<any[][]>([]);
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          uploader:profiles!documents_uploaded_by_fkey(full_name)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

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

  const handleViewDocument = async (doc: Document) => {
    setViewingDoc(doc);
    setLoadingFile(true);
    setFileData([]);

    try {
      // Get the latest version of the document
      const { data: versionData, error: versionError } = await supabase
        .from('document_versions')
        .select('file_path')
        .eq('document_id', doc.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (versionError) throw versionError;

      // Download the file from storage
      const { data: fileBlob, error: downloadError } = await supabase
        .storage
        .from('documents')
        .download(versionData.file_path);

      if (downloadError) throw downloadError;

      // Parse the file
      const arrayBuffer = await fileBlob.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      setFileData(jsonData as any[][]);
    } catch (error: any) {
      toast.error('Error al cargar el archivo: ' + error.message);
      setViewingDoc(null);
    } finally {
      setLoadingFile(false);
    }
  };

  const stats = {
    total: documents.length,
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
                <h1 className="text-xl font-bold">EurobanSync - Documentos Internos</h1>
                <p className="text-sm text-muted-foreground">Panel de Equipo Interno</p>
              </div>
            </div>
            
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* User Info Card */}
        <Card className="mb-6 shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Últimas Versiones de Documentos Aprobados</CardTitle>
                <CardDescription className="mt-1">{user?.email}</CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10">
                Internal Team
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Stats */}
        <Card className="mb-6 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos Aprobados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Listos para consulta
            </p>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Documentos Disponibles</CardTitle>
            <CardDescription>
              Haz clic en un documento para ver su contenido
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
                <p className="text-muted-foreground">No hay documentos aprobados aún</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Versión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Subido por</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow 
                      key={doc.id} 
                      className={`hover:bg-muted/50 cursor-pointer ${viewingDoc?.id === doc.id ? 'bg-muted' : ''}`}
                      onClick={() => handleViewDocument(doc)}
                    >
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {doc.document_type?.replace(/_/g, ' ') || 'N/A'}
                        </Badge>
                      </TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* File Viewer */}
        {viewingDoc && (
          <Card className="shadow-elegant mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Visor de Archivo: {viewingDoc.title}
                  </CardTitle>
                  <CardDescription>
                    Versión {viewingDoc.current_version}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setViewingDoc(null);
                    setFileData([]);
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingFile ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Cargando archivo...</p>
                </div>
              ) : fileData.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No se pudo cargar el contenido del archivo</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[600px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {fileData[0]?.map((header: any, index: number) => (
                          <TableHead key={index} className="whitespace-nowrap font-semibold">
                            {header || `Columna ${index + 1}`}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fileData.slice(1).map((row: any[], rowIndex: number) => (
                        <TableRow key={rowIndex}>
                          {row.map((cell: any, cellIndex: number) => (
                            <TableCell key={cellIndex} className="whitespace-nowrap">
                              {cell !== null && cell !== undefined ? String(cell) : '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InternalDocs;
