import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design detection
 * Detects device type, screen size, and provides responsive values
 */
export function useDevice() {
  const [device, setDevice] = useState({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isEdge: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 667,
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ua = navigator.userAgent.toLowerCase();

      // Device type based on width
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // OS detection
      const isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /android/.test(ua);

      // Browser detection
      const isChrome = /chrome/.test(ua) && !/edge|edg/.test(ua);
      const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
      const isEdge = /edge|edg/.test(ua);

      setDevice({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        isEdge,
        width,
        height,
      });
    };

    // Initial check
    checkDevice();

    // Listen for resize
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // Responsive values based on device
  const responsive = {
    // Layout
    maxWidth: device.isDesktop ? '1200px' : device.isTablet ? '720px' : '100%',
    contentPadding: device.isDesktop ? '24px' : device.isTablet ? '20px' : '12px',
    headerHeight: device.isDesktop ? '100px' : device.isTablet ? '90px' : '80px',

    // Typography
    fontSize: {
      xs: device.isDesktop ? '11px' : device.isTablet ? '10px' : '9px',
      sm: device.isDesktop ? '13px' : device.isTablet ? '12px' : '11px',
      md: device.isDesktop ? '15px' : device.isTablet ? '14px' : '13px',
      lg: device.isDesktop ? '20px' : device.isTablet ? '18px' : '16px',
      xl: device.isDesktop ? '28px' : device.isTablet ? '24px' : '20px',
    },

    // Spacing
    gap: {
      sm: device.isDesktop ? '12px' : device.isTablet ? '10px' : '8px',
      md: device.isDesktop ? '20px' : device.isTablet ? '16px' : '12px',
      lg: device.isDesktop ? '24px' : device.isTablet ? '20px' : '16px',
    },

    // Grid
    videoColumns: device.isDesktop ? 4 : device.isTablet ? 3 : 2,
    newsColumns: device.isDesktop ? 3 : device.isTablet ? 2 : 1,

    // Card
    cardPadding: device.isDesktop ? '20px' : device.isTablet ? '16px' : '12px',
    borderRadius: device.isDesktop ? '14px' : device.isTablet ? '12px' : '10px',

    // Logo
    logoWidth: device.isDesktop ? '140px' : device.isTablet ? '130px' : '100px',

    // Video thumbnails
    videoHeight: device.isDesktop ? '140px' : device.isTablet ? '120px' : '100px',

    // Spotify embed height
    spotifyHeight: device.isDesktop ? '450' : device.isTablet ? '400' : '352',
  };

  return { ...device, responsive };
}

export default useDevice;
