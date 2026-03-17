import { useStatistiques } from '@/store/appStore';
import { Users, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

export function StatsCompact() {
  const stats = useStatistiques();

  const cards = [
    {
      label: 'TOTAL CANDIDATS',
      value: stats.total,
      sub: '+12%',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
      icon: Users,
    },
    {
      label: 'EN ATTENTE',
      value: stats.importe + stats.enRelecture,
      sub: null,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-500',
      icon: Clock,
    },
    {
      label: 'ANALYSES IA',
      value: stats.enAnalyse + stats.analyse,
      sub: stats.total > 0 ? `+${Math.round(((stats.enAnalyse + stats.analyse) / stats.total) * 100)}%` : null,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-500',
      icon: TrendingUp,
    },
    {
      label: 'DOSSIERS VALIDES',
      value: stats.valide,
      sub: null,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-500',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-[#e6ff82]/30 rounded-xl border border-[#e6ff82]/40 px-5 py-4 flex items-center justify-between"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-slate-800 tabular-nums leading-none tracking-tight">
                  {card.value.toLocaleString('fr-FR')}
                </p>
                {card.sub && (
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {card.sub}
                  </span>
                )}
              </div>
            </div>
            <div className={`w-11 h-11 rounded-full ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
