import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";

export const useMarketingData = () => {
  return useQuery({
    queryKey: ["marketing-data"],
    queryFn: async () => {
      // Buscar totais gerais
      const [
        { count: totalUsuarios },
        { count: totalMatriculas },
        { data: certificadosData },
        { data: transacoesData }
      ] = await Promise.all([
        supabase.from("usuarios").select("*", { count: "exact", head: true }),
        supabase.from("matriculas").select("*", { count: "exact", head: true }),
        supabase.from("certificados").select("*"),
        supabase.from("transacoes_pagamento").select("*").eq("status", "completed")
      ]);

      // Calcular receita total
      const receitaTotal = transacoesData?.reduce((acc, t) => acc + Number(t.valor), 0) || 0;
      const certificadosVendidos = certificadosData?.filter(c => c.pago)?.length || 0;

      // Taxa de conversão: certificados vendidos / total de matrículas
      const taxaConversao = totalMatriculas ? ((certificadosVendidos / totalMatriculas) * 100).toFixed(1) : "0.0";

      // Buscar dados dos últimos 6 meses
      const mesesData = [];
      for (let i = 5; i >= 0; i--) {
        const dataInicio = startOfMonth(subMonths(new Date(), i));
        const dataFim = endOfMonth(subMonths(new Date(), i));
        
        const [
          { count: matriculasNoMes },
          { count: usuariosNoMes },
          { data: certificadosNoMes }
        ] = await Promise.all([
          supabase.from("matriculas")
            .select("*", { count: "exact", head: true })
            .gte("data_matricula", dataInicio.toISOString())
            .lte("data_matricula", dataFim.toISOString()),
          supabase.from("usuarios")
            .select("*", { count: "exact", head: true })
            .gte("criado_em", dataInicio.toISOString())
            .lte("criado_em", dataFim.toISOString()),
          supabase.from("certificados")
            .select("*")
            .eq("pago", true)
            .gte("emitido_em", dataInicio.toISOString())
            .lte("emitido_em", dataFim.toISOString())
        ]);

        mesesData.push({
          mes: format(dataInicio, "MMM"),
          organico: usuariosNoMes || 0,
          pago: matriculasNoMes || 0,
          conversoes: certificadosNoMes?.length || 0
        });
      }

      // Buscar performance por curso
      const { data: cursosData } = await supabase.from("cursos").select("id, titulo");
      
      const cursosPerformance = await Promise.all(
        (cursosData || []).map(async (curso) => {
          const [
            { count: matriculas },
            { data: certificados }
          ] = await Promise.all([
            supabase.from("matriculas")
              .select("*", { count: "exact", head: true })
              .eq("curso_id", curso.id),
            supabase.from("certificados")
              .select("*")
              .eq("curso_id", curso.id)
              .eq("pago", true)
          ]);

          const receitaCurso = certificados?.length || 0;
          
          return {
            curso: curso.titulo,
            matriculas: matriculas || 0,
            certificados: receitaCurso,
            receita: receitaCurso * 39 // Preço padrão do certificado
          };
        })
      );

      // Calcular crescimento mensal
      const mesAtual = mesesData[mesesData.length - 1];
      const mesAnterior = mesesData[mesesData.length - 2];
      
      const calcularCrescimento = (atual: number, anterior: number) => {
        if (!anterior) return 0;
        return ((atual - anterior) / anterior * 100).toFixed(1);
      };

      return {
        kpis: {
          alcanceTotal: totalMatriculas || 0,
          leadsGerados: totalUsuarios || 0,
          taxaConversao: Number(taxaConversao),
          roiMedio: receitaTotal,
          crescimento: {
            alcance: Number(calcularCrescimento(mesAtual?.pago || 0, mesAnterior?.pago || 0)),
            leads: Number(calcularCrescimento(mesAtual?.organico || 0, mesAnterior?.organico || 0)),
            conversao: Number(calcularCrescimento(mesAtual?.conversoes || 0, mesAnterior?.conversoes || 0)),
            receita: Number(calcularCrescimento(
              (mesAtual?.conversoes || 0) * 39, 
              (mesAnterior?.conversoes || 0) * 39
            ))
          }
        },
        mesesData,
        cursosPerformance,
        certificadosVendidos,
        receitaTotal
      };
    },
    refetchInterval: 60000 // Atualizar a cada 1 minuto
  });
};
