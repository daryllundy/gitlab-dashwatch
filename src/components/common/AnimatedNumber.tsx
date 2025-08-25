import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { config } from '@/config';

import type { AnimatedNumberProps } from '@/types';

const AnimatedNumber = ({ 
  value, 
  duration = config.monitoring.animation.numberCountDuration, 
  formatter = (val) => val.toString(),
  className
}: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = displayValue;
    const changeInValue = value - startValue;
    
    const animateValue = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: cubic-bezier
      const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
      const easedProgress = easeOutQuart(progress);
      
      const currentValue = startValue + changeInValue * easedProgress;
      setDisplayValue(Math.round(currentValue));
      
      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };
    
    setKey(prev => prev + 1);
    requestAnimationFrame(animateValue);
    
    return () => {
      startTime = null;
    };
  }, [value, duration]);

  return (
    <span 
      key={key} 
      className={cn("inline-block transition-transform animate-count-up", className)}
    >
      {formatter(displayValue)}
    </span>
  );
};

export default AnimatedNumber;
