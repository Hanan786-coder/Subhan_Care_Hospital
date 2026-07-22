import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for detecting session timeout based on user inactivity.
 * Optimized for low-end devices by throttling event handlers.
 * 
 * @param {number} timeoutMinutes - The number of minutes of inactivity before timeout.
 * @param {Function} onTimeout - The callback to execute when a timeout occurs.
 * @param {Function} onWarning - Optional callback to warn the user before timeout.
 * @returns {Function} Function to manually reset the timer.
 */
const useSessionTimeout = (timeoutMinutes, onTimeout, onWarning) => {
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();
    lastActivityRef.current = Date.now();

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - 60000; // Warn 1 minute before timeout

    if (onWarning) {
      warningRef.current = setTimeout(() => {
        onWarning();
      }, warningMs);
    }

    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }, [timeoutMinutes, onTimeout, onWarning, clearTimers]);

  useEffect(() => {
    resetTimer();

    let throttleTimeout = null;

    const handleActivity = () => {
      // Throttle activity detection to once per 60 seconds
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
          resetTimer();
        }, 60000);
      }
    };

    // Attach event listeners for activity tracking
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('click', handleActivity);
    document.addEventListener('scroll', handleActivity, { passive: true });

    return () => {
      clearTimers();
      if (throttleTimeout) clearTimeout(throttleTimeout);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('scroll', handleActivity);
    };
  }, [resetTimer, clearTimers]);

  return resetTimer;
};

export default useSessionTimeout;
