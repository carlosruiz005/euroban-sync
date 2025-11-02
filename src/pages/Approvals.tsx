import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, LogOut, Clock, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { authHelpers } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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

const Approvals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [comments, setComments] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [approving, setApproving] = useState(false);
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

  const handleRequestChanges = async () => {
    if (!selectedDoc || !user) return;

    if (!comments.trim()) {
      toast.error('Por favor ingresa un comentario');
      return;
    }

    setRequesting(true);

    try {
      const { error } = await supabase
        .from('approvals')
        .insert({
          document_id: selectedDoc.id,
          version_number: selectedDoc.current_version,
          requested_by: user.id,
          status: 'changes_requested' satisfies Database['public']['Enums']['document_status'],
          comments: comments,
        });

      if (error) throw error;

      toast.success('Cambios solicitados exitosamente');
      setSelectedDoc(null);
      setComments('');
      loadDocuments();
    } catch (error: any) {
      toast.error('Error al solicitar cambios: ' + error.message);
    } finally {
      setRequesting(false);
    }
  };

  const handleApproveDocument = async (doc: Document) => {
    if (!user) return;

    setApproving(true);

    try {
      // Update document status to approved
      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'approved' satisfies Database['public']['Enums']['document_status'] })
        .eq('id', doc.id);

      if (updateError) throw updateError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          document_id: doc.id,
          version_number: doc.current_version,
          requested_by: user.id,
          reviewed_by: user.id,
          status: 'approved' satisfies Database['public']['Enums']['document_status'],
          comments: 'Documento aprobado',
        });

      if (approvalError) throw approvalError;

      // Create notification for the uploader
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: doc.uploaded_by,
          type: 'document_approved' satisfies Database['public']['Enums']['notification_type'],
          title: 'Documento Aprobado',
          message: `Tu documento "${doc.title}" ha sido aprobado`,
          document_id: doc.id,
        });

      if (notificationError) throw notificationError;

      toast.success('Documento aprobado exitosamente');
      loadDocuments();
    } catch (error: any) {
      toast.error('Error al aprobar documento: ' + error.message);
    } finally {
      setApproving(false);
    }
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
                <h1 className="text-xl font-bold">EurobanSync - Aprobaciones</h1>
                <p className="text-sm text-muted-foreground">Panel de Ejecutivos</p>
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
                <CardTitle>Panel de Aprobaciones</CardTitle>
                <CardDescription className="mt-1">{user?.email}</CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10">
                Executive
              </Badge>
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
                En el sistema
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes de Revisión</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Esperando aprobación
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
                Listos
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
                Requieren revisión
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Documents Table */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Documentos para Aprobación</CardTitle>
            <CardDescription>
              Revisa y solicita cambios en los documentos
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Versión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Subido por</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
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
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleApproveDocument(doc)}
                            disabled={approving || doc.status === 'approved'}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {doc.status === 'approved' ? 'Aprobado' : 'Aprobar'}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedDoc(doc)}
                                disabled={doc.status === 'approved'}
                              >
                                Solicitar Cambios
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Solicitar Cambios</DialogTitle>
                                <DialogDescription>
                                  Documento: {doc.title}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="comments">Comentarios</Label>
                                  <Textarea
                                    id="comments"
                                    placeholder="Describe los cambios necesarios..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleRequestChanges}
                                  disabled={requesting}
                                >
                                  {requesting ? 'Enviando...' : 'Solicitar Cambios'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
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

export default Approvals;
