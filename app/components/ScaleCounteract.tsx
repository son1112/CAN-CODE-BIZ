'use client';

import { useEffect } from 'react';

export default function ScaleCounteract() {
  useEffect(() => {
    const counteractZoom = () => {
      // Get the current zoom level from our debug component logic
      const zoom = window.outerWidth / window.innerWidth;
      const textSizeAdjust = window.getComputedStyle(document.body).getPropertyValue('-webkit-text-size-adjust') ||
                           window.getComputedStyle(document.body).getPropertyValue('text-size-adjust');

      // If Chrome is scaling text, counteract it
      if (zoom > 1.1 || (textSizeAdjust && textSizeAdjust !== 'none' && textSizeAdjust !== '100%')) {
        const uiElements = document.querySelectorAll('.no-text-scale, .ui-locked');
        const scaleFactor = 1 / Math.max(zoom, 1);

        uiElements.forEach((element) => {
          if (element instanceof HTMLElement) {
            // Apply inverse scaling to counteract browser scaling
            element.style.transform = `scale(${scaleFactor})`;
            element.style.transformOrigin = 'top left';
            element.style.fontSize = '14px';
            element.style.lineHeight = '1.2';
          }
        });
      }
    };

    // Run on load and when window changes
    counteractZoom();
    window.addEventListener('resize', counteractZoom);

    // Also run periodically to catch changes
    const interval = setInterval(counteractZoom, 1000);

    return () => {
      window.removeEventListener('resize', counteractZoom);
      clearInterval(interval);
    };
  }, []);

  return null; // This component doesn't render anything
}