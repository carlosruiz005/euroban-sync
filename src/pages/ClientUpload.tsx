import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { documentHelpers, authHelpers, type DocumentType } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function ClientUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('datos_generales');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        toast({
          title: "Tipo de archivo no permitido",
          description: "Solo se permiten archivos Excel (.xlsx, .xls) y CSV (.csv)",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate('/auth');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !user || !title.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Check if document of this type already exists
      const { data: existingDoc } = await documentHelpers.getDocumentByType(documentType);

      let documentId: string;
      let versionNumber: number;

      if (existingDoc) {
        // Document exists, create new version
        documentId = existingDoc.id;
        versionNumber = existingDoc.current_version + 1;

        // Update document version
        const { error: updateError } = await documentHelpers.incrementDocumentVersion(
          documentId,
          versionNumber
        );

        if (updateError) throw updateError;
      } else {
        // Create new document record
        const { data: newDocument, error: docError } = await documentHelpers.createDocument(
          title,
          description,
          documentType,
          user.id
        );

        if (docError) throw docError;
        documentId = newDocument.id;
        versionNumber = 1;
      }

      // Upload file to storage
      const fileName = `${documentId}_v${versionNumber}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document version record
      const { error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: versionNumber,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          uploaded_by: user.id,
        });

      if (versionError) throw versionError;

      toast({
        title: existingDoc ? "Nueva versión creada" : "Archivo subido exitosamente",
        description: existingDoc 
          ? `Se creó la versión ${versionNumber} del documento`
          : "Tu documento ha sido cargado correctamente",
      });

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setDocumentType('datos_generales');
      const fileInput = window.document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      toast({
        title: "Error al subir archivo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Cargar Documentos
            </h1>
            <p className="text-muted-foreground">
              Sube tus documentos para revisión y aprobación
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Nuevo Documento
            </CardTitle>
            <CardDescription>
              Completa la información y selecciona el archivo a cargar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Título del Documento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Contrato de Préstamo 2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-type">
                  Tipo de Documento <span className="text-destructive">*</span>
                </Label>
                <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
                  <SelectTrigger id="document-type">
                    <SelectValue placeholder="Selecciona el tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solicitud_prestamo">Solicitud de Préstamo</SelectItem>
                    <SelectItem value="liquidacion_prestamo">Liquidación de Préstamo</SelectItem>
                    <SelectItem value="datos_generales">Datos Generales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción opcional del documento..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-input">
                  Archivo <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file-input"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    required
                    className="cursor-pointer"
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Subir Documento
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
