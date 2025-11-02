-- Create enum for document types
CREATE TYPE public.document_type AS ENUM ('solicitud_prestamo', 'liquidacion_prestamo', 'datos_generales');

-- Add document_type column to documents table
ALTER TABLE public.documents
ADD COLUMN document_type public.document_type NOT NULL DEFAULT 'datos_generales';

-- Create unique constraint to ensure only one active document per type
CREATE UNIQUE INDEX idx_documents_unique_type ON public.documents(document_type) WHERE status != 'rejected';