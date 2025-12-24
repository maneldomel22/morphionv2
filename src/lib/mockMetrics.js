const creativeStatuses = ['active', 'testing', 'paused'];
const statusLabels = {
  active: 'Ativo',
  testing: 'Em teste',
  paused: 'Pausado'
};

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const ticketOptions = [
  { name: 'Plano Básico', value: 49.00 },
  { name: 'Plano Pro', value: 147.00 },
  { name: 'Plano Premium', value: 297.00 },
  { name: 'Upsell - Consultoria', value: 88.00 },
  { name: 'Upsell - Template Pack', value: 37.00 }
];

function generatePayments(seed, paidCount) {
  const payments = [];

  for (let i = 0; i < paidCount; i++) {
    const ticketSeed = seed + i * 73;
    const ticketIndex = Math.floor(seededRandom(ticketSeed) * ticketOptions.length);
    const ticket = ticketOptions[ticketIndex];

    payments.push({
      id: `pay_${seed}_${i}`,
      ticketName: ticket.name,
      amount: ticket.value,
      date: new Date(Date.now() - Math.floor(seededRandom(ticketSeed + 10) * 7 * 24 * 60 * 60 * 1000)).toISOString()
    });
  }

  return payments.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function generateConsistentMetrics(videoId, index) {
  const seed = videoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const impressions = Math.floor(45000 + seededRandom(seed) * 80000);
  const ctr = 0.8 + seededRandom(seed + 1) * 1.7;
  const clicks = Math.floor(impressions * (ctr / 100));
  const cpc = 1.45 + seededRandom(seed + 2) * 1.75;
  const cpm = 15.8 + seededRandom(seed + 3) * 22.7;
  const leads = Math.floor(clicks * (0.15 + seededRandom(seed + 4) * 0.25));
  const conversionRate = 1.2 + seededRandom(seed + 5) * 1.6;
  const paid = Math.floor(leads * (conversionRate / 100));
  const totalSpent = clicks * cpc;
  const cpa = paid > 0 ? totalSpent / paid : 0;

  const payments = generatePayments(seed, paid);
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const statusIndex = Math.floor(seededRandom(seed + 6) * 3);
  const status = creativeStatuses[statusIndex];

  const performanceScore = (ctr / 2.5) * 0.3 + (conversionRate / 2.8) * 0.3 + (1 - (cpa / 45)) * 0.4;

  const history = Array.from({ length: 7 }, (_, i) => {
    const daySeed = seed + i * 100;
    const dayLeads = Math.floor(leads / 7 + seededRandom(daySeed) * (leads / 5));
    const dayPaid = Math.floor(paid / 7 + seededRandom(daySeed + 50) * (paid / 5));
    return {
      day: `Dia ${i + 1}`,
      leads: dayLeads,
      paid: dayPaid
    };
  });

  const insights = generateInsights(ctr, cpa, conversionRate, performanceScore, status, totalRevenue, paid);

  return {
    impressions,
    ctr: Number(ctr.toFixed(2)),
    clicks,
    cpc: Number(cpc.toFixed(2)),
    cpm: Number(cpm.toFixed(2)),
    leads,
    paid,
    cpa: Number(cpa.toFixed(2)),
    conversionRate: Number(conversionRate.toFixed(2)),
    totalSpent: Number(totalSpent.toFixed(2)),
    totalRevenue: Number(totalRevenue.toFixed(2)),
    payments,
    status,
    statusLabel: statusLabels[status],
    performanceScore: Number((performanceScore * 100).toFixed(1)),
    history,
    insights
  };
}

function generateInsights(ctr, cpa, conversionRate, performanceScore, status, totalRevenue, paid) {
  const insights = [];
  const avgTicket = paid > 0 ? totalRevenue / paid : 0;

  if (avgTicket > 150) {
    insights.push({
      type: 'success',
      message: `Ticket médio excelente (R$ ${avgTicket.toFixed(2)}). A maior parte da receita vem de planos intermediários e premium. Continue com esta estratégia.`
    });
  } else if (avgTicket > 80 && avgTicket <= 150) {
    insights.push({
      type: 'info',
      message: `Ticket médio bom (R$ ${avgTicket.toFixed(2)}). Teste CTAs focados em planos superiores para aumentar receita por conversão.`
    });
  } else if (avgTicket > 0) {
    insights.push({
      type: 'warning',
      message: `Ticket médio baixo (R$ ${avgTicket.toFixed(2)}). Maior concentração em plano básico. Considere testar ofertas de upsell no checkout.`
    });
  }

  if (ctr > 2.0) {
    insights.push({
      type: 'success',
      message: `CTR acima da média (+${((ctr - 1.5) / 1.5 * 100).toFixed(0)}%). Recomendado: aumentar budget em 30% para maximizar alcance.`
    });
  } else if (ctr < 1.2) {
    insights.push({
      type: 'warning',
      message: 'CTR abaixo da média. Teste um novo hook nos primeiros 3 segundos do vídeo.'
    });
  }

  if (cpa < 25) {
    insights.push({
      type: 'success',
      message: 'CPA excelente! Considere criar variações A/B deste criativo para escalar resultados.'
    });
  } else if (cpa > 35) {
    insights.push({
      type: 'warning',
      message: 'CPA elevado. Revise a segmentação de público e otimize a copy da oferta.'
    });
  }

  if (conversionRate > 2.2) {
    insights.push({
      type: 'success',
      message: 'Taxa de conversão excelente. Este criativo está ressoando muito bem com o público.'
    });
  } else if (conversionRate < 1.5) {
    insights.push({
      type: 'info',
      message: 'Conversão pode melhorar. Teste diferentes CTAs e ofertas na página de destino.'
    });
  }

  if (status === 'paused') {
    insights.push({
      type: 'info',
      message: 'Criativo pausado. Reative quando tiver budget disponível ou após otimizações.'
    });
  } else if (status === 'testing') {
    insights.push({
      type: 'info',
      message: 'Criativo em fase de teste. Aguarde ao menos 72h antes de tomar decisões baseadas em dados.'
    });
  }

  return insights.slice(0, 3);
}

export function getGlobalMetrics(videosWithMetrics) {
  const totalActives = videosWithMetrics.filter(v => v.metrics.status === 'active').length;
  const totalLeads = videosWithMetrics.reduce((sum, v) => sum + v.metrics.leads, 0);
  const totalPaid = videosWithMetrics.reduce((sum, v) => sum + v.metrics.paid, 0);
  const totalSpent = videosWithMetrics.reduce((sum, v) => sum + v.metrics.totalSpent, 0);
  const totalRevenue = videosWithMetrics.reduce((sum, v) => sum + v.metrics.totalRevenue, 0);
  const avgConversionRate = totalLeads > 0 ? (totalPaid / totalLeads) * 100 : 0;
  const avgCPA = totalPaid > 0 ? totalSpent / totalPaid : 0;

  return {
    activesCount: totalActives,
    activesCountTrend: 8.3,
    totalLeads,
    totalLeadsTrend: 12.5,
    totalPaid,
    totalPaidTrend: 8.7,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalRevenueTrend: 15.2,
    conversionRate: Number(avgConversionRate.toFixed(2)),
    conversionRateTrend: 0.3,
    avgCPA: Number(avgCPA.toFixed(2)),
    avgCPATrend: -5.2,
    totalSpent: Number(totalSpent.toFixed(2)),
    totalSpentTrend: 18.9
  };
}

export function getMockMetricsForVideo(videoId, index) {
  return generateConsistentMetrics(videoId, index);
}

export const mockInsightTemplates = [
  'Este criativo apresenta CTR acima da média, porém CPA elevado.',
  'Performance consistente nos últimos 7 dias. Recomendado continuar.',
  'Possível fadiga detectada. Considere criar nova variação.',
  'Público masculino 25-34 responde melhor. Ajuste segmentação.',
  'Melhor performance entre 18h-22h. Otimize horários de veiculação.'
];
