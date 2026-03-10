import { useStatistiques } from '@/store/appStore';
import { Users, BarChart3, FileCheck, CheckCircle2 } from 'lucide-react';

export function StatsCompact() {
  const stats = useStatistiques();

  const statItems = [
    { icon: Users, label: 'Total', value: stats.total, color: 'text-primary-500 bg-primary-50' },
    { icon: BarChart3, label: 'Analyses', value: stats.analyse, color: 'text-purple-500 bg-purple-50' },
    { icon: FileCheck, label: 'En relecture', value: stats.enRelecture, color: 'text-amber-500 bg-amber-50' },
    { icon: CheckCircle2, label: 'Valides', value: stats.valide, color: 'text-emerald-500 bg-emerald-50' },
  ];

  return (
    <div className="flex items-center gap-6">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${item.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-shine-text-tertiary font-medium">{item.label}</span>
              <span className="text-lg font-semibold text-shine-text-primary">{item.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
