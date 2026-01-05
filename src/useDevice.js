import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoints matching CSS
 */
const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1280,
  ultraWide: 1536,
};

/**
 * Custom hook for responsive design
 * Provides device info and CSS variable-based responsive values
 */
export function useDevice() {
  const getDeviceInfo = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isLargeDesktop: false,
        isTouch: true,
        isIOS: false,
        isAndroid: false,
        isSafari: false,
        isChrome: false,
        isEdge: false,
        isFirefox: false,
        orientation: 'portrait',
        pixelRatio: 1,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    // Device size detection
    const isMobile = width < BREAKPOINTS.tablet;
    const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
    const isDesktop = width >= BREAKPOINTS.desktop && width < BREAKPOINTS.largeDesktop;
    const isLargeDesktop = width >= BREAKPOINTS.largeDesktop;

    // Touch detection
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // OS detection
    const isIOS = /iphone|ipad|ipod/.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);
    const isMac = /mac/.test(platform) && !isIOS;
    const isWindows = /win/.test(platform);

    // Browser detection
    const isChrome = /chrome/.test(ua) && !/edge|edg|opr/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|chromium/.test(ua);
    const isEdge = /edge|edg/.test(ua);
    const isFirefox = /firefox/.test(ua);

    // Orientation
    const orientation = width > height ? 'landscape' : 'portrait';

    // Pixel ratio for retina displays
    const pixelRatio = window.devicePixelRatio || 1;

    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      isLargeDesktop,
      isTouch,
      isIOS,
      isAndroid,
      isMac,
      isWindows,
      isSafari,
      isChrome,
      isEdge,
      isFirefox,
      orientation,
      pixelRatio,
    };
  }, []);

  const [device, setDevice] = useState(getDeviceInfo);

  useEffect(() => {
    const handleResize = () => {
      setDevice(getDeviceInfo());
    };

    // Debounced resize handler for performance
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleResize);

    // Initial call
    handleResize();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [getDeviceInfo]);

  // Get CSS variable value
  const getCSSVar = useCallback((varName) => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }, []);

  // Responsive values that read from CSS variables
  const responsive = {
    // Layout
    maxWidth: getCSSVar('--max-width') || (device.isMobile ? '100%' : device.isTablet ? '740px' : device.isLargeDesktop ? '1180px' : '960px'),
    contentPadding: getCSSVar('--content-padding') || (device.isMobile ? '12px' : device.isTablet ? '20px' : '24px'),
    headerHeight: getCSSVar('--header-height') || (device.isMobile ? '70px' : device.isTablet ? '80px' : '90px'),
    navHeight: device.isMobile ? '44px' : device.isTablet ? '48px' : '52px',

    // Grid columns
    videoColumns: device.width >= 1536 ? 5 : device.isLargeDesktop ? 4 : device.isDesktop ? 4 : device.isTablet ? 3 : 2,
    newsColumns: device.isLargeDesktop ? 3 : device.isDesktop ? 2 : device.isTablet ? 2 : 1,

    // Component sizes
    logoWidth: device.isLargeDesktop ? '140px' : device.isDesktop ? '130px' : device.isTablet ? '110px' : '90px',
    videoHeight: device.isLargeDesktop ? '140px' : device.isDesktop ? '130px' : device.isTablet ? '110px' : '90px',
    spotifyHeight: device.isDesktop || device.isLargeDesktop ? 450 : device.isTablet ? 400 : 352,
    buttonHeight: '44px',

    // Typography (matching CSS)
    fontSize: {
      xs: device.isDesktop ? '13px' : device.isTablet ? '12px' : '11px',
      sm: device.isDesktop ? '14px' : device.isTablet ? '13px' : '12px',
      base: device.isDesktop ? '15px' : device.isTablet ? '14px' : '13px',
      md: device.isDesktop ? '17px' : device.isTablet ? '16px' : '14px',
      lg: device.isDesktop ? '20px' : device.isTablet ? '18px' : '16px',
      xl: device.isDesktop ? '28px' : device.isTablet ? '24px' : '20px',
      '2xl': device.isDesktop ? '36px' : device.isTablet ? '30px' : '24px',
    },

    // Gap/Spacing - for grid and flex gaps
    gap: {
      xs: '4px',
      sm: '8px',
      md: device.isDesktop ? '20px' : device.isTablet ? '16px' : '12px',
      lg: device.isDesktop ? '24px' : device.isTablet ? '20px' : '16px',
      xl: device.isDesktop ? '32px' : device.isTablet ? '24px' : '20px',
    },

    // Spacing (for padding/margin)
    spacing: {
      xs: '4px',
      sm: '8px',
      md: device.isDesktop ? '16px' : '12px',
      lg: device.isDesktop ? '24px' : device.isTablet ? '20px' : '16px',
      xl: device.isDesktop ? '32px' : device.isTablet ? '24px' : '20px',
    },

    // Border radius
    borderRadius: device.isDesktop ? '12px' : '10px',
    borderRadiusSm: '6px',
    borderRadiusLg: device.isDesktop ? '16px' : '14px',
    borderRadiusFull: '9999px',

    // Tab styling
    tabPadding: device.isDesktop ? '14px 20px' : device.isTablet ? '12px 14px' : '10px 8px',
    tabFontSize: device.isDesktop ? '15px' : device.isTablet ? '13px' : '11px',

    // Shadows
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 6px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  };

  return {
    ...device,
    responsive,
    styles: responsive, // backwards compatibility
    breakpoints: BREAKPOINTS,
  };
}

export default useDevice;
