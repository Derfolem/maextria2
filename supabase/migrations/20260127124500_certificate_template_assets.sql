-- Adicionar campos de imagens nos modelos
ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS assinatura_imagem_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS papel_timbrado_url text NOT NULL DEFAULT '';

-- Bucket para assets de certificados
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate-assets', 'certificate-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies do bucket (publico para leitura, admin para escrita)
CREATE POLICY "Certificado assets publicos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificate-assets');

CREATE POLICY "Admins podem inserir assets de certificado"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificate-assets'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins podem atualizar assets de certificado"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'certificate-assets'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins podem deletar assets de certificado"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'certificate-assets'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );
