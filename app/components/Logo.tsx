'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeConfig = {
  sm: {
    container: 'w-8 h-8',
    image: 32,
    text: 'text-sm',
  },
  md: {
    container: 'w-12 h-12',
    image: 48,
    text: 'text-lg',
  },
  lg: {
    container: 'w-16 h-16',
    image: 64,
    text: 'text-xl',
  },
  xl: {
    container: 'w-24 h-24',
    image: 96,
    text: 'text-2xl',
  },
};

export default function Logo({ 
  size = 'md', 
  variant = 'default', 
  showText = true, 
  className,
  onClick
}: LogoProps) {
  const config = sizeConfig[size];
  
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center', className)}>
        <div 
          className={cn(
            'relative rounded-full overflow-hidden flex items-center justify-center',
            'bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100',
            'shadow-lg transform hover:scale-105 transition-transform duration-300',
            'border-2 border-blue-200/40',
            onClick ? 'cursor-pointer hover:shadow-xl' : '',
            config.container
          )}
          onClick={onClick}
        >
          <Image
            src="/rubber-duck-logo.png"
            alt="Rubber Ducky"
            width={config.image}
            height={config.image}
            className="object-cover scale-110"
            style={{ objectPosition: 'center center' }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-200/15 to-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div 
        className={cn(
          'relative rounded-full overflow-hidden flex items-center justify-center',
          'bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100',
          'shadow-2xl shadow-blue-500/20 transform hover:scale-105 transition-transform duration-300',
          'border-2 border-blue-200/40',
          onClick ? 'cursor-pointer hover:shadow-xl' : '',
          config.container
        )}
        onClick={onClick}
      >
        <Image
          src="/rubber-duck-logo.png"
          alt="Rubber Ducky"
          width={config.image}
          height={config.image}
          className="object-cover scale-110"
          style={{ objectPosition: 'center center' }}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/15 to-transparent rounded-full"></div>
      </div>
      
      {showText && (
        <div>
          <h1 className={cn(
            'font-bold text-gray-900 leading-tight',
            config.text
          )}>
            Rubber Ducky Live
          </h1>
          {size === 'lg' || size === 'xl' ? (
            <p className="text-sm text-gray-600 font-medium">
              Your premium AI thinking companion 🦆
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}