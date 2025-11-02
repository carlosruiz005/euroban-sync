-- Allow clients to update their own documents
CREATE POLICY "Clients can update their own documents"
ON public.documents
FOR UPDATE
USING (auth.uid() = uploaded_by AND has_role(auth.uid(), 'client'::app_role))
WITH CHECK (auth.uid() = uploaded_by AND has_role(auth.uid(), 'client'::app_role));