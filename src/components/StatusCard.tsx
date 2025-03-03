
import React from 'react';
import { cn } from '@/lib/utils';
import StatusIndicator from './StatusIndicator';
import AnimatedNumber from './AnimatedNumber';
import { LucideIcon } from 'lucide-react';

type Status = 'healthy' | 'warning' | 'error' | 'inactive';

interface StatusCardProps {
  title: string;
  icon?: LucideIcon;
  status: Status;
  value?: number;
  unit?: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const StatusCard = ({
  title,
  icon: Icon,
  status,
  value,
  unit,
  subtitle,
  className,
  children,
  onClick,
  style,
}: StatusCardProps) => {
  return (
    <div 
      className={cn(
        "glass-card rounded-xl p-5 flex flex-col space-y-3 overflow-hidden transition-all duration-300",
        onClick && "cursor-pointer hover:ring-2 hover:ring-primary/10",
        className
      )}
      onClick={onClick}
      style={style}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-primary/5 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h3 className="font-medium text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <StatusIndicator status={status} />
      </div>
      
      {value !== undefined && (
        <div className="flex items-end gap-1">
          <AnimatedNumber 
            value={value} 
            className="text-2xl font-semibold tracking-tight" 
          />
          {unit && <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>}
        </div>
      )}
      
      {children && <div>{children}</div>}
    </div>
  );
};

export default StatusCard;
