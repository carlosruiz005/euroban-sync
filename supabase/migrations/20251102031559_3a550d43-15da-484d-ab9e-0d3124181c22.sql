-- Políticas de storage para el bucket documents
-- Permitir a clientes subir sus propios documentos
CREATE POLICY "Clients can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND has_role(auth.uid(), 'client'::app_role)
);

-- Permitir a clientes ver sus propios documentos subidos
CREATE POLICY "Clients can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND has_role(auth.uid(), 'client'::app_role)
);

-- Permitir al equipo interno y admins ver todos los documentos
CREATE POLICY "Internal team and admins can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'internal_team'::app_role)
  )
);