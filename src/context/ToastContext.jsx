import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  IoCheckmarkCircle,
  IoAlertCircle,
  IoWarning,
  IoInformationCircle,
  IoClose
} from 'react-icons/io5';

const ToastContext = createContext(null);

// Audio click / chime generator using Web Audio API (zero audio file dependencies)
const playHapticAudio = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'error') {
      // Gentle double alert blip
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'success') {
      // Crisp pleasant medical chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(784, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else {
      // Neutral crisp pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {
    // Graceful fallback if audio is blocked
  }
};

// Physical hardware vibration for touch/mobile devices
const triggerHardwareVibrate = (type) => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      if (type === 'error') {
        window.navigator.vibrate([40, 50, 40, 50, 60]);
      } else {
        window.navigator.vibrate([30, 40, 30]);
      }
    } catch (e) {
      // Ignore unsupported browsers
    }
  }
};

// Single Toast Card Component
const ToastItem = ({ toast, onDismiss }) => {
  const { id, type = 'info', title, message, duration = 4500 } = toast;
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(duration);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      handleClose();
    }, remainingTime);
  }, [remainingTime]);

  const pauseTimer = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      setRemainingTime((prev) => Math.max(0, prev - elapsed));
    }
  };

  const resumeTimer = () => {
    setIsPaused(false);
    startTimer();
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 280);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  // Configurations for glassmorphism styles by type
  const config = {
    success: {
      title: title || 'Action Successful',
      icon: <IoCheckmarkCircle className="toast-type-icon" />,
      accentColor: '#10B981',
      secondaryAccent: '#0D9488',
      glowRgb: '16, 185, 129',
      borderRgba: 'rgba(16, 185, 129, 0.45)',
      badgeBg: 'rgba(16, 185, 129, 0.14)',
      badgeColor: '#059669',
      shimmerColor: 'rgba(16, 185, 129, 0.25)'
    },
    error: {
      title: title || 'Notice / Action Failed',
      icon: <IoAlertCircle className="toast-type-icon" />,
      accentColor: '#F43F5E',
      secondaryAccent: '#E11D48',
      glowRgb: '244, 63, 94',
      borderRgba: 'rgba(244, 63, 94, 0.45)',
      badgeBg: 'rgba(244, 63, 94, 0.14)',
      badgeColor: '#E11D48',
      shimmerColor: 'rgba(244, 63, 94, 0.25)'
    },
    warning: {
      title: title || 'Attention Required',
      icon: <IoWarning className="toast-type-icon" />,
      accentColor: '#F59E0B',
      secondaryAccent: '#D97706',
      glowRgb: '245, 158, 11',
      borderRgba: 'rgba(245, 158, 11, 0.45)',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeColor: '#D97706',
      shimmerColor: 'rgba(245, 158, 11, 0.25)'
    },
    info: {
      title: title || 'System Update',
      icon: <IoInformationCircle className="toast-type-icon" />,
      accentColor: '#0EA5E9',
      secondaryAccent: '#0284C7',
      glowRgb: '14, 165, 233',
      borderRgba: 'rgba(14, 165, 233, 0.45)',
      badgeBg: 'rgba(14, 165, 233, 0.14)',
      badgeColor: '#0284C7',
      shimmerColor: 'rgba(14, 165, 233, 0.25)'
    }
  }[type] || {
    title: title || 'Notification',
    icon: <IoInformationCircle className="toast-type-icon" />,
    accentColor: '#0EA5E9',
    secondaryAccent: '#0284C7',
    glowRgb: '14, 165, 233',
    borderRgba: 'rgba(14, 165, 233, 0.45)',
    badgeBg: 'rgba(14, 165, 233, 0.14)',
    badgeColor: '#0284C7',
    shimmerColor: 'rgba(14, 165, 233, 0.25)'
  };

  return (
    <div
      className={`glass-toast-card ${type} ${isExiting ? 'toast-exit' : 'toast-enter-vibrate'}`}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      style={{
        '--toast-accent': config.accentColor,
        '--toast-secondary': config.secondaryAccent,
        '--toast-glow-rgb': config.glowRgb,
        '--toast-border': config.borderRgba,
        '--toast-duration': `${duration}ms`
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Top Glass Reflection Accent Line */}
      <div className="glass-toast-shimmer" />

      {/* Main Toast Content Body */}
      <div className="glass-toast-inner">
        {/* Pulsing Icon Bubble */}
        <div
          className="glass-toast-icon-wrapper"
          style={{
            backgroundColor: config.badgeBg,
            color: config.badgeColor,
            borderColor: config.borderRgba
          }}
        >
          {config.icon}
          <span
            className="glass-toast-icon-pulse"
            style={{ backgroundColor: config.accentColor }}
          />
        </div>

        {/* Message and Title */}
        <div className="glass-toast-text-wrap">
          {config.title && (
            <h4 className="glass-toast-title" style={{ color: config.badgeColor }}>
              {config.title}
            </h4>
          )}
          <div className="glass-toast-message">{message}</div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleClose}
          className="glass-toast-close-btn"
          aria-label="Close notification"
        >
          <IoClose size={14} />
        </button>
      </div>

      {/* Auto-Dismiss Progress Indicator Bar */}
      <div className="glass-toast-progress-track">
        <div
          className={`glass-toast-progress-bar ${isPaused ? 'paused' : ''}`}
          style={{
            background: `linear-gradient(90deg, ${config.accentColor}, ${config.secondaryAccent})`,
            animationDuration: `${duration}ms`
          }}
        />
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, options = {}) => {
    if (!message) return;
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const duration = options.duration !== undefined ? options.duration : 4500;
    const title = options.title;

    // Trigger haptic vibration & pleasant tactile sound
    triggerHardwareVibrate(type);
    playHapticAudio(type);

    setToasts((prev) => [
      ...prev.slice(-3), // Keep max 4 toasts on screen to prevent clutter
      { id, type, title, message, duration }
    ]);

    return id;
  }, []);

  const toast = useCallback(
    (message, options) => {
      return addToast('info', message, options);
    },
    [addToast]
  );

  toast.success = useCallback((msg, opt) => addToast('success', msg, opt), [addToast]);
  toast.error = useCallback((msg, opt) => addToast('error', msg, opt), [addToast]);
  toast.warning = useCallback((msg, opt) => addToast('warning', msg, opt), [addToast]);
  toast.info = useCallback((msg, opt) => addToast('info', msg, opt), [addToast]);
  toast.dismiss = dismiss;

  return (
    <ToastContext.Provider value={{ toast, showToast: addToast, dismissToast: dismiss }}>
      {children}
      {/* Toast Notification Mount Container */}
      <div className="glass-toast-container" aria-label="Notifications">
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
