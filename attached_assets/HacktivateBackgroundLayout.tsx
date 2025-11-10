import { ReactNode } from 'react';
import hacktivateBackground from '@assets/hacktivate-bg.jpg';

interface HacktivateBackgroundLayoutProps {
  children: ReactNode;
}

export function HacktivateBackgroundLayout({ children }: HacktivateBackgroundLayoutProps) {
  return (
    <div 
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${hacktivateBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      
      {/* Content above overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
