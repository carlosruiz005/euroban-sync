-- Drop the unique index that's causing the conflict
DROP INDEX IF EXISTS public.idx_documents_unique_type;