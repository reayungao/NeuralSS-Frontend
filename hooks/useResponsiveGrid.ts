import { useState, useLayoutEffect } from 'react';

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

const getColumnsForWidth = (width: number): number => {
  if (width < BREAKPOINTS.sm) return 2;
  if (width < BREAKPOINTS.md) return 3;
  if (width < BREAKPOINTS.lg) return 4;
  if (width < BREAKPOINTS.xl) return 5;
  return 6;
};

export const useResponsiveGrid = (containerRef: React.RefObject<HTMLElement>) => {
  const [columnCount, setColumnCount] = useState(2);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const newWidth = entries[0].contentRect.width;
        setContainerWidth(newWidth);
        setColumnCount(getColumnsForWidth(newWidth));
      }
    });

    resizeObserver.observe(container);

    // Initial calculation
    const initialWidth = container.offsetWidth;
    setContainerWidth(initialWidth);
    setColumnCount(getColumnsForWidth(initialWidth));


    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return { columnCount, containerWidth };
};