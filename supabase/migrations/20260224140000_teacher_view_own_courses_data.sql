-- Permite que professores vejam matriculas dos seus cursos
CREATE POLICY "Professores veem matriculas dos seus cursos"
ON public.matriculas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cursos c
    WHERE c.id = matriculas.curso_id
    AND c.professor_id = auth.uid()
  )
);

-- Permite que professores vejam transacoes dos seus cursos
CREATE POLICY "Professores veem transacoes dos seus cursos"
ON public.transacoes_pagamento
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cursos c
    WHERE c.id = transacoes_pagamento.curso_id
    AND c.professor_id = auth.uid()
  )
);
