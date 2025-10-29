import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { TimerConfig } from '@shared/schema';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(deadline: Date): TimeRemaining {
  const now = new Date().getTime();
  const end = deadline.getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isExpired: false,
  };
}

export function CountdownTimer() {
  const { data: config } = useQuery<TimerConfig>({
    queryKey: ['/api/timer-config'],
  });

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!config?.deadline) return;

    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining(new Date(config.deadline)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [config?.deadline]);

  if (!config) return null;

  const { days, hours, minutes, seconds, isExpired } = timeRemaining;
  const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
  
  const isWarning = !isExpired && totalMinutes < 60 && totalMinutes > 10;
  const isCritical = !isExpired && totalMinutes <= 10;

  return (
    <div className="flex flex-col items-center gap-2" data-testid="countdown-timer">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="font-medium">Time Remaining</span>
      </div>
      
      <div className={`
        flex items-center gap-3 font-mono text-4xl md:text-6xl font-bold tracking-tight
        ${isExpired ? 'text-muted-foreground' : ''}
        ${isWarning ? 'text-amber-600 dark:text-amber-500' : ''}
        ${isCritical ? 'text-destructive animate-pulse' : ''}
      `}>
        {isExpired ? (
          <span className="text-2xl md:text-3xl" data-testid="timer-expired">Upload Disabled</span>
        ) : (
          <>
            <div className="flex flex-col items-center" data-testid="timer-days">
              <span>{String(days).padStart(2, '0')}</span>
              <span className="text-xs font-normal text-muted-foreground">DAYS</span>
            </div>
            <span className="text-muted-foreground">:</span>
            <div className="flex flex-col items-center" data-testid="timer-hours">
              <span>{String(hours).padStart(2, '0')}</span>
              <span className="text-xs font-normal text-muted-foreground">HRS</span>
            </div>
            <span className="text-muted-foreground">:</span>
            <div className="flex flex-col items-center" data-testid="timer-minutes">
              <span>{String(minutes).padStart(2, '0')}</span>
              <span className="text-xs font-normal text-muted-foreground">MIN</span>
            </div>
            <span className="text-muted-foreground">:</span>
            <div className="flex flex-col items-center" data-testid="timer-seconds">
              <span>{String(seconds).padStart(2, '0')}</span>
              <span className="text-xs font-normal text-muted-foreground">SEC</span>
            </div>
          </>
        )}
      </div>

      {isCritical && !isExpired && (
        <p className="text-sm text-destructive font-medium">
          Upload deadline approaching!
        </p>
      )}
    </div>
  );
}
