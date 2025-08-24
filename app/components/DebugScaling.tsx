'use client';

import { useEffect, useState } from 'react';

export default function DebugScaling() {
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const getScalingInfo = () => {
      const info = {
        devicePixelRatio: window.devicePixelRatio,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        documentElementStyle: window.getComputedStyle(document.documentElement),
        bodyStyle: window.getComputedStyle(document.body),
        userAgent: navigator.userAgent,
        viewport: {
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight
        }
      };

      const htmlFontSize = info.documentElementStyle.fontSize;
      const bodyFontSize = info.bodyStyle.fontSize;
      const textSizeAdjust = info.bodyStyle.getPropertyValue('-webkit-text-size-adjust') ||
                           info.bodyStyle.getPropertyValue('text-size-adjust');

      setDebugInfo(JSON.stringify({
        htmlFontSize,
        bodyFontSize,
        textSizeAdjust,
        devicePixelRatio: info.devicePixelRatio,
        zoom: info.outerWidth / info.innerWidth,
        browser: info.userAgent.includes('Chrome') ? 'Chrome' :
                info.userAgent.includes('Safari') ? 'Safari' :
                info.userAgent.includes('Firefox') ? 'Firefox' : 'Other'
      }, null, 2));
    };

    getScalingInfo();
    window.addEventListener('resize', getScalingInfo);

    return () => window.removeEventListener('resize', getScalingInfo);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'black',
        color: 'white',
        padding: '10px',
        fontSize: '10px',
        fontFamily: 'monospace',
        zIndex: 99999,
        maxWidth: '300px',
        overflow: 'auto',
        maxHeight: '200px'
      }}
    >
      <pre>{debugInfo}</pre>
    </div>
  );
}