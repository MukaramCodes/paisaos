import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  accent?: 'green' | 'blue' | 'amber' | 'red' | 'purple';
  className?: string;
}

const accentMap = {
  green: {
    bg: 'bg-[#D8F3DC]',
    icon: 'text-[#1B4332]',
    trend: 'text-[#2D6A4F]',
    trendBg: 'bg-[#D8F3DC]',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-700',
    trend: 'text-blue-700',
    trendBg: 'bg-blue-50',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-700',
    trend: 'text-amber-700',
    trendBg: 'bg-amber-50',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    trend: 'text-red-600',
    trendBg: 'bg-red-50',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-700',
    trend: 'text-purple-700',
    trendBg: 'bg-purple-50',
  },
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = 'green',
  className,
}: MetricCardProps) {
  const colors = accentMap[accent];

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[#1C1C1C] pkr-amount leading-tight">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium',
                trend.positive ? 'bg-[#D8F3DC] text-[#2D6A4F]' : 'bg-red-50 text-red-600'
              )}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        {Icon && (
          <div className={clsx('p-2.5 rounded-xl ml-3 flex-shrink-0', colors.bg)}>
            <Icon size={20} className={colors.icon} />
          </div>
        )}
      </div>
    </div>
  );
}
