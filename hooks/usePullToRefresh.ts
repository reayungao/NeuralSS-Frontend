import { useState, useRef, useCallback } from 'react';
import { PULL_TO_REFRESH_THRESHOLD } from '../config';

interface UsePullToRefreshOptions {
  onRefresh: () => void;
  isRefreshing: boolean;
  mainContentRef: React.RefObject<HTMLElement>;
}

export const usePullToRefresh = ({ onRefresh, isRefreshing, mainContentRef }: UsePullToRefreshOptions) => {
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (mainContentRef.current && mainContentRef.current.scrollTop === 0) {
      touchStartY.current = e.targetTouches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  }, [mainContentRef]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === 0 || isRefreshing) return;
    const currentY = e.targetTouches[0].clientY;
    const distance = currentY - touchStartY.current;

    if (distance > 0) {
      e.preventDefault();
      // Apply resistance to the pull for a more natural feel
      const resistedDistance = distance < PULL_TO_REFRESH_THRESHOLD
          ? distance
          : PULL_TO_REFRESH_THRESHOLD + Math.pow(distance - PULL_TO_REFRESH_THRESHOLD, 0.75);
      setPullDistance(resistedDistance);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartY.current === 0 || isRefreshing) return;
    
    if (pullDistance > PULL_TO_REFRESH_THRESHOLD) {
      onRefresh();
    } else {
      setPullDistance(0);
    }
    touchStartY.current = 0;
  }, [isRefreshing, onRefresh, pullDistance]);
  
  // Reset pull distance when the refresh completes
  if (!isRefreshing && pullDistance > 0) {
      setPullDistance(0);
  }

  const containerProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  const contentTransform = {
    transform: `translateY(${isRefreshing ? PULL_TO_REFRESH_THRESHOLD : pullDistance}px)`,
    transition: pullDistance > 0 && !isRefreshing ? 'none' : 'transform 0.3s ease-out',
  };

  return { containerProps, contentTransform, pullDistance };
};
