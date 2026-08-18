import React, { useEffect, useRef, memo } from 'react';

// Smooth cubic easing: lively acceleration with gentle deceleration
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function formatNumber(num, decimals = 0) {
  if (decimals > 0) {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  return Math.round(num).toLocaleString();
}

/**
 * Ultra-smooth animated number counter.
 * Counts from 0 (or previous value) to target value over a fixed duration (~1200ms).
 * Small numbers (e.g. 0 to 7) count smoothly/slowly; large numbers (e.g. 0 to 1000) count fast.
 */
const CountUp = ({
  value = 0,
  duration = 1200,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  style = {}
}) => {
  const spanRef = useRef(null);
  const startValRef = useRef(0);
  const animFrameRef = useRef(null);

  // Parse target number safely
  const targetNumber = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startVal = startValRef.current;
    const endVal = targetNumber;

    // Immediately set starting value in DOM
    el.textContent = `${prefix}${formatNumber(startVal, decimals)}${suffix}`;

    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startVal + (endVal - startVal) * easedProgress;

      if (decimals > 0) {
        el.textContent = `${prefix}${current.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })}${suffix}`;
      } else {
        const rounded = progress >= 1 ? endVal : Math.round(current);
        el.textContent = `${prefix}${rounded.toLocaleString()}${suffix}`;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        startValRef.current = endVal;
        el.textContent = `${prefix}${formatNumber(endVal, decimals)}${suffix}`;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [targetNumber, duration, prefix, suffix, decimals]);

  return (
    <span
      ref={spanRef}
      className={className}
      style={style}
    >
      {prefix}0{suffix}
    </span>
  );
};

export default memo(CountUp);
