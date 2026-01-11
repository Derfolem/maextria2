INSERT INTO public.configuracoes_site (chave, valor, descricao) VALUES
  ('teacher_banner_enabled', '0', 'Exibe banner na landing de professores (1 = ativo)'),
  ('teacher_banner_image_url', '', 'URL da imagem do banner da landing de professores'),
  ('teacher_banner_link_url', '', 'Link do banner da landing de professores'),
  ('teacher_banner_alt', 'Banner para professores', 'Texto alternativo do banner da landing de professores')
ON CONFLICT (chave) DO NOTHING;
