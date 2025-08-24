'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

interface VoiceWaveformProps {
  isActive: boolean;
  audioLevel?: number; // 0-100 volume level
  className?: string;
  color?: string;
  barCount?: number;
  height?: number;
}

export default function VoiceWaveform({ 
  isActive, 
  audioLevel = 50, 
  className = '', 
  color = '#3b82f6',
  barCount = 12,
  height = 40
}: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const { isMobile } = useMobileNavigation();
  const [bars, setBars] = useState<number[]>([]);

  // Initialize bars
  useEffect(() => {
    setBars(Array(barCount).fill(0.1));
  }, [barCount]);

  // Animation loop
  useEffect(() => {
    if (!isActive || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update bar heights based on audio level and random variation
      const newBars = bars.map((_, index) => {
        const baseHeight = (audioLevel / 100) * 0.8;
        const randomVariation = Math.random() * 0.4;
        const timeOffset = Date.now() * 0.003 + index * 0.5;
        const waveEffect = Math.sin(timeOffset) * 0.3;
        
        return Math.max(0.1, Math.min(1, baseHeight + randomVariation + waveEffect));
      });
      
      setBars(newBars);

      // Draw bars
      const barWidth = canvas.width / barCount;
      const maxBarHeight = canvas.height * 0.9;

      newBars.forEach((barHeight, index) => {
        const x = index * barWidth + barWidth * 0.2;
        const width = barWidth * 0.6;
        const barHeightPixels = barHeight * maxBarHeight;
        const y = (canvas.height - barHeightPixels) / 2;

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeightPixels);
        gradient.addColorStop(0, color + 'FF');
        gradient.addColorStop(0.5, color + 'CC');
        gradient.addColorStop(1, color + '88');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, barHeightPixels);

        // Add glow effect for mobile
        if (isMobile) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillRect(x, y, width, barHeightPixels);
          ctx.shadowBlur = 0; // Reset shadow
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, audioLevel, bars, barCount, color, isMobile]);

  // Set canvas size
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2; // Retina support
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2); // Scale for retina
      }
    }
  }, []);

  return (
    <div className={`voice-waveform-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        style={{ height: `${height}px` }}
        aria-label={isActive ? "Voice activity waveform" : "Voice waveform (inactive)"}
      />
      
      {/* Fallback static bars for non-canvas environments */}
      <div className="flex items-center justify-center gap-1 h-full canvas-fallback" style={{ display: 'none' }}>
        {bars.map((barHeight, index) => (
          <div
            key={index}
            className="bg-current rounded-full transition-all duration-100"
            style={{
              width: '3px',
              height: `${barHeight * height}px`,
              backgroundColor: color,
              opacity: isActive ? 0.8 : 0.3,
              transform: isActive ? `scaleY(${barHeight})` : 'scaleY(0.2)'
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Hook to simulate audio level (in real implementation, this would connect to actual audio analysis)
export function useAudioLevel(isActive: boolean) {
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setAudioLevel(0);
      return;
    }

    const interval = setInterval(() => {
      // Simulate realistic audio levels
      const baseLevel = 30 + Math.random() * 40; // 30-70 base range
      const variation = Math.sin(Date.now() * 0.005) * 20; // Smooth variation
      const spikes = Math.random() < 0.1 ? Math.random() * 30 : 0; // Occasional spikes
      
      const level = Math.max(5, Math.min(95, baseLevel + variation + spikes));
      setAudioLevel(level);
    }, 50); // Update 20 times per second

    return () => clearInterval(interval);
  }, [isActive]);

  return audioLevel;
}