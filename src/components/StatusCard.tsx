
import React from 'react';
import { cn } from '@/lib/utils';
import StatusIndicator from './StatusIndicator';
import AnimatedNumber from './AnimatedNumber';
import type { LucideIcon } from 'lucide-react';
import type { StatusType } from '@/types';

/**
 * StatusCard component - displays monitoring status information in a card format
 * 
 * @param title - The main title of the card
 * @param icon - Optional Lucide icon component to display
 * @param status - Current status of the monitored item
 * @param value - Optional numeric value to display
 * @param unit - Optional unit for the numeric value
 * @param subtitle - Optional subtitle text
 * @param className - Additional CSS classes
 * @param children - Optional child components
 * @param onClick - Optional click handler
 * @param style - Optional inline styles
 */
interface StatusCardProps {
  title: string;
  icon?: LucideIcon;
  status: StatusType;
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
