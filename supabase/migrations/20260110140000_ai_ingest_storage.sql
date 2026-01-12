-- Storage policies for AI ingest bucket
CREATE POLICY "Usuarios autenticados podem enviar arquivos AI"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-ingest'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Usuarios autenticados podem ler seus arquivos AI"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'ai-ingest'
    AND auth.role() = 'authenticated'
  );
