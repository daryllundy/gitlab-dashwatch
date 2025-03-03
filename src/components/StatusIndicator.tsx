
import React from 'react';
import { cn } from "@/lib/utils";

type Status = 'healthy' | 'warning' | 'error' | 'inactive';

interface StatusIndicatorProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  label?: string;
  className?: string;
}

const StatusIndicator = ({ 
  status, 
  size = 'md', 
  pulse = false, 
  label,
  className 
}: StatusIndicatorProps) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusClasses = {
    healthy: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-destructive',
    inactive: 'bg-muted',
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn(
          "rounded-full status-indicator",
          sizeClasses[size],
          statusClasses[status],
          pulse && status !== 'inactive' && "animate-pulse-opacity"
        )}
        aria-label={`Status: ${status}`}
      />
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
};

export default StatusIndicator;
