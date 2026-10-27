import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  IoMailOutline,
  IoLockClosedOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoShieldCheckmarkOutline,
  IoCallOutline,
  IoHeadsetOutline,
  IoArrowForward,
  IoAlertCircleOutline
} from 'react-icons/io5';

// Exact Medical Cross with Heart Center SVG Brand Logo
const HospitalBrandLogo = ({ size = 38 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="crossGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
      <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0D9488" floodOpacity="0.25" />
      </filter>
    </defs>
    {/* Rounded Cross Arms */}
    <rect x="34" y="6" width="32" height="88" rx="14" fill="url(#crossGradient)" filter="url(#softGlow)" />
    <rect x="6" y="34" width="88" height="32" rx="14" fill="url(#crossGradient)" filter="url(#softGlow)" />
    {/* Center Heart Cutout */}
    <path
      d="M50 63C50 63 36 53 36 44C36 39.5 39.5 36 44 36C46.8 36 48.8 37.6 50 39.2C51.2 37.6 53.2 36 56 36C60.5 36 64 39.5 64 44C64 53 50 63 50 63Z"
      fill="#FFFFFF"
    />
  </svg>
);

// Hand-drawn hollow doodle heart matching Reference Image
const HandDrawnHeartDoodle = ({ size = 24, color = '#0D9488' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '5px', transform: 'rotate(6deg)' }}
  >
    <path
      d="M16 26.5C15.4 25.8 5.8 18.2 5.8 11.2C5.8 7.2 8.8 4.2 12.8 4.2C15.1 4.2 15.7 5.5 16 6.2C16.3 5.5 16.9 4.2 19.2 4.2C23.2 4.2 26.2 7.2 26.2 11.2C26.2 18.2 16.6 25.8 16 26.5Z"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Ultra-realistic 3D Glassmorphism Floating Bubble Component
const FloatingGlassBubble = ({
  size = 50,
  top,
  left,
  right,
  bottom,
  color = 'mint',
  delay = '0s',
  duration = '6s',
  animation = 'floatBubble1',
  opacity = 0.85
}) => {
  const colorGradients = {
    mint: 'radial-gradient(circle at 32% 32%, rgba(255, 255, 255, 0.95) 0%, rgba(209, 250, 229, 0.75) 35%, rgba(52, 211, 153, 0.35) 70%, rgba(16, 185, 129, 0.15) 100%)',
    peach: 'radial-gradient(circle at 32% 32%, rgba(255, 255, 255, 0.95) 0%, rgba(254, 215, 170, 0.8) 40%, rgba(251, 146, 60, 0.3) 75%, rgba(249, 115, 22, 0.12) 100%)',
    cyan: 'radial-gradient(circle at 32% 32%, rgba(255, 255, 255, 0.95) 0%, rgba(204, 251, 241, 0.8) 35%, rgba(45, 212, 191, 0.35) 75%, rgba(13, 148, 136, 0.15) 100%)',
    emerald: 'radial-gradient(circle at 32% 32%, rgba(255, 255, 255, 0.95) 0%, rgba(167, 243, 208, 0.75) 40%, rgba(5, 150, 105, 0.25) 80%, rgba(4, 120, 87, 0.12) 100%)'
  };

  return (
    <div
      className="login-bubble"
      style={{
        position: 'absolute',
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        borderRadius: '50%',
        background: colorGradients[color] || colorGradients.mint,
        boxShadow: '0 8px 24px rgba(13, 148, 136, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(13, 148, 136, 0.15)',
        backdropFilter: 'blur(3px)',
        border: '1px solid rgba(255, 255, 255, 0.75)',
        pointerEvents: 'none',
        zIndex: 4,
        opacity,
        animation: `${animation} ${duration} ease-in-out infinite alternate`,
        animationDelay: delay
      }}
    >
      {/* Gloss Specular Highlight Shine */}
      <div
        style={{
          position: 'absolute',
          top: '16%',
          left: '20%',
          width: '30%',
          height: '20%',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.85)',
          filter: 'blur(0.8px)',
          transform: 'rotate(-32deg)'
        }}
      />
    </div>
  );
};

const LoginPage = () => {
  const { login, getDefaultRouteForRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lock body/html scrollbar completely on mount and restore on unmount
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name || 'User'}! Loading your workspace...`, {
        title: 'Authentication Successful'
      });
      const targetRoute = getDefaultRouteForRole(user.role);
      navigate(targetRoute, { replace: true });
    } catch (err) {
      const responseData = err.response?.data;
      const field = responseData?.field;
      const errorMessage =
        responseData?.message || 'Invalid email or password. Please verify your credentials.';

      let title = 'Access Denied';
      if (field === 'email' || errorMessage.toLowerCase().includes('email')) {
        title = 'Invalid Email';
        setEmailError(errorMessage);
      } else if (field === 'password' || errorMessage.toLowerCase().includes('password')) {
        title = 'Incorrect Password';
        setPasswordError(errorMessage);
      } else if (field === 'both') {
        title = 'Missing Credentials';
        setEmailError('Please enter your email address.');
        setPasswordError('Please enter your password.');
      } else if (errorMessage.toLowerCase().includes('deactivated')) {
        title = 'Account Deactivated';
      }

      toast.error(errorMessage, {
        title
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-outer"
      style={{
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#F5F8F7',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
      }}
    >
      {/* Floating Bubbles Animation CSS Keyframes */}
      <style>{`
        @keyframes floatBubble1 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(-16px) translateX(8px) scale(1.05); }
        }
        @keyframes floatBubble2 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(14px) translateX(-10px) scale(0.95); }
        }
        @keyframes floatBubble3 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.08); }
        }
        @keyframes floatBubble4 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(-18px) translateX(-6px) rotate(12deg); }
        }

        /* ===== LOGIN PAGE RESPONSIVE ===== */
        @media (max-width: 768px) {
          .login-hero-column { display: none !important; }
          .login-form-column {
            flex: 1 1 100% !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .login-form-card {
            padding: 1.75rem 1.5rem 1.5rem !important;
            border-radius: 20px !important;
          }
          .login-main-row {
            gap: 0 !important;
            justify-content: center !important;
          }
          .login-header { display: none !important; }
          .login-foliage { display: none !important; }
          .login-bubble { display: none !important; }
          .login-orb { display: none !important; }
          .login-outer {
            background-color: #F5F8F7 !important;
            justify-content: center !important;
            padding: 1rem !important;
            overflow-y: auto !important;
            height: auto !important;
            min-height: 100vh !important;
            max-height: none !important;
          }
          .login-main-wrapper {
            padding: 0.5rem 0.5rem !important;
            overflow: visible !important;
            flex-grow: 1 !important;
          }
        }

        @media (max-width: 480px) {
          .login-form-card {
            padding: 1.5rem 1.15rem 1.25rem !important;
            border-radius: 18px !important;
            box-shadow: 0 12px 30px rgba(13, 148, 136, 0.06) !important;
          }
        }
      `}</style>

      {/* ============================================================== */}
      {/* BACKGROUND AMBIENT ORBS & 3D FLOATING BUBBLES                   */}
      {/* ============================================================== */}

      {/* Top Center Mint Glow Orb */}
      <div
        className="login-orb"
        style={{
          position: 'absolute',
          top: -30,
          left: '36%',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167, 243, 208, 0.45) 0%, rgba(209, 250, 229, 0) 70%)',
          filter: 'blur(45px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Top Right Warm Peach Glow Orb */}
      <div
        className="login-orb"
        style={{
          position: 'absolute',
          top: -20,
          right: '8%',
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(254, 215, 170, 0.58) 0%, rgba(254, 243, 199, 0) 70%)',
          filter: 'blur(45px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Bottom Right Soft Mint/Teal Tint */}
      <div
        className="login-orb"
        style={{
          position: 'absolute',
          bottom: '2%',
          right: '20%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204, 251, 241, 0.55) 0%, rgba(204, 251, 241, 0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Dynamic Floating Glass Bubbles */}
      <FloatingGlassBubble
        size={110}
        top="45px"
        right="65px"
        color="peach"
        duration="7s"
        animation="floatBubble1"
        opacity={0.8}
      />
      <FloatingGlassBubble
        size={135}
        top="-20px"
        left="42%"
        color="mint"
        duration="8.5s"
        animation="floatBubble2"
        opacity={0.7}
      />
      <FloatingGlassBubble
        size={46}
        top="110px"
        left="34%"
        color="cyan"
        delay="0.5s"
        duration="6s"
        animation="floatBubble3"
        opacity={0.85}
      />
      <FloatingGlassBubble
        size={36}
        top="40px"
        left="14%"
        color="mint"
        delay="1s"
        duration="5.5s"
        animation="floatBubble4"
        opacity={0.8}
      />
      <FloatingGlassBubble
        size={68}
        bottom="80px"
        right="33%"
        color="cyan"
        delay="1.2s"
        duration="7.2s"
        animation="floatBubble2"
        opacity={0.75}
      />
      <FloatingGlassBubble
        size={44}
        bottom="170px"
        left="43%"
        color="emerald"
        delay="0.8s"
        duration="6.8s"
        animation="floatBubble1"
        opacity={0.7}
      />
      <FloatingGlassBubble
        size={28}
        top="85px"
        right="22%"
        color="peach"
        delay="1.5s"
        duration="5s"
        animation="floatBubble3"
        opacity={0.8}
      />
      <FloatingGlassBubble
        size={38}
        bottom="110px"
        left="11%"
        color="mint"
        delay="2s"
        duration="6.2s"
        animation="floatBubble4"
        opacity={0.75}
      />

      {/* Botanical Foliage Leaves in Bottom Corners ONLY */}
      <img
        className="login-foliage"
        src="/foliage_blur.png"
        alt="Botanical Foliage"
        style={{
          position: 'absolute',
          bottom: -20,
          left: -20,
          width: 'clamp(140px, 15vw, 220px)',
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
          zIndex: 15
        }}
      />

      <img
        className="login-foliage"
        src="/foliage_blur.png"
        alt="Botanical Foliage"
        style={{
          position: 'absolute',
          bottom: -20,
          right: -20,
          width: 'clamp(140px, 15vw, 220px)',
          transform: 'scaleX(-1)',
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
          zIndex: 15
        }}
      />

      {/* ============================================================== */}
      {/* TOP HEADER BAR                                                 */}
      {/* ============================================================== */}
      <header
        className="login-header"
        style={{
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '1rem 1.5rem 0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 20,
          flexShrink: 0
        }}
      >
        {/* Brand Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <HospitalBrandLogo size={42} />
          <div>
            <div
              style={{
                fontSize: '1.28rem',
                fontWeight: 800,
                color: '#1E293B',
                lineHeight: 1.15,
                letterSpacing: '-0.025em'
              }}
            >
              LifeCare Hospital
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#64748B',
                letterSpacing: '0.04em',
                marginTop: '1px'
              }}
            >
              Health • Care • Together
            </div>
          </div>
        </div>

        {/* Right Help & Hotline Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div
            className="d-none d-sm-flex align-items-center gap-1"
            style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}
          >
            <IoHeadsetOutline size={17} style={{ color: '#475569' }} />
            <span>Need Help?</span>
          </div>
          <a
            href="tel:+919876543210"
            style={{
              textDecoration: 'none',
              backgroundColor: '#E6F7F5',
              border: '1px solid #CCFBF1',
              color: '#0D9488',
              borderRadius: '9999px',
              padding: '0.4rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(13, 148, 136, 0.08)'
            }}
          >
            <IoCallOutline size={14} />
            <span>+91 98765 43210</span>
          </a>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN CONTENT: 2-COLUMN BALANCED LAYOUT (ZERO SCROLL)           */}
      {/* ============================================================== */}
      <main
        className="login-main-wrapper"
        style={{
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0.5rem 1.5rem 1.25rem',
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        <div
          className="login-main-row"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3rem'
          }}
        >
          {/* ------------------------------------------------------------ */}
          {/* LEFT COLUMN: HERO INFORMATION & DOCTOR/HOSPITAL ARCH         */}
          {/* ------------------------------------------------------------ */}
          <div
            className="login-hero-column"
            style={{
              flex: '1 1 540px',
              maxWidth: '560px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            {/* Trusted Healthcare Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#E6F7F2',
                color: '#0F766E',
                border: '1px solid #A7F3D0',
                borderRadius: '9999px',
                padding: '0.28rem 0.95rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '0.85rem',
                alignSelf: 'flex-start'
              }}
            >
              <IoShieldCheckmarkOutline size={16} style={{ color: '#0D9488' }} />
              <span>Trusted Healthcare for a Healthier Tomorrow</span>
            </div>

            {/* Bold Heading */}
            <h1
              style={{
                fontSize: 'clamp(2.3rem, 3.2vw, 3.2rem)',
                fontWeight: 800,
                lineHeight: 1.12,
                margin: 0,
                letterSpacing: '-0.03em'
              }}
            >
              <span style={{ color: '#1E293B', display: 'block' }}>Your Health,</span>
              <span style={{ color: '#0D9488', display: 'block' }}>Our Priority</span>
            </h1>

            {/* Subtitle Description */}
            <p
              style={{
                color: '#64748B',
                fontSize: '0.94rem',
                lineHeight: 1.5,
                marginTop: '0.65rem',
                marginBottom: '1.25rem',
                fontWeight: 450,
                maxWidth: '500px'
              }}
            >
              We provide modern healthcare services with compassion, advanced technology and expert medical professionals.
            </p>

            {/* HERO VISUAL COMPOSITION: SCRIPT + HOSPITAL ARCH WITH DOCTOR IN FRONT + ECG */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '280px',
                display: 'flex',
                alignItems: 'flex-end',
                marginTop: '0.5rem'
              }}
            >
              {/* Handwritten Script Tagline - Cleanly on the Left with ZERO Overlap on Doctor */}
              <div
                style={{
                  position: 'absolute',
                  top: '35px',
                  left: '-15px',
                  zIndex: 8,
                  fontFamily: "'Caveat', cursive",
                  fontSize: '1.9rem',
                  fontWeight: 700,
                  color: '#0F766E',
                  lineHeight: 1.2,
                  transform: 'rotate(-5deg)',
                  textShadow: '0 2px 8px rgba(255,255,255,0.95)',
                  maxWidth: '190px'
                }}
              >
                Better Care
                <br />
                Brighter Tomorrow
                <HandDrawnHeartDoodle size={24} color="#0D9488" />
              </div>

              {/* Hospital Building Arch Portal */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: '10px',
                  width: '335px',
                  height: '260px',
                  borderRadius: '170px 170px 22px 22px',
                  overflow: 'hidden',
                  zIndex: 2,
                  boxShadow: '0 16px 36px rgba(13, 148, 136, 0.1)',
                  border: '3px solid #FFFFFF'
                }}
              >
                <img
                  src="/lifecare_building.jpg"
                  alt="LifeCare Hospital Building"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 35%'
                  }}
                />
              </div>

              {/* Soft Ambient Mint Aura Behind Arch */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '5px',
                  width: '345px',
                  height: '268px',
                  borderRadius: '175px 175px 26px 26px',
                  background: 'linear-gradient(135deg, rgba(167, 243, 208, 0.45) 0%, rgba(204, 251, 241, 0.15) 100%)',
                  zIndex: 1,
                  transform: 'scale(1.03)'
                }}
              />

              {/* ECG Pulse Heartbeat Wave Line */}
              <svg
                viewBox="0 0 160 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  position: 'absolute',
                  bottom: '35px',
                  right: '-15px',
                  width: '155px',
                  height: '45px',
                  zIndex: 5,
                  opacity: 0.8
                }}
              >
                <path
                  d="M0 25 L35 25 L45 8 L55 42 L65 15 L75 32 L82 25 L160 25"
                  stroke="#14B8A6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Exact Doctor Cutout (User Provided) - Shifted slightly right to give ample breathing room */}
              <img
                src="/doctor_nurse.png"
                alt="Doctor with Clipboard"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '53%',
                  transform: 'translateX(-50%)',
                  height: '270px',
                  width: 'auto',
                  objectFit: 'contain',
                  zIndex: 6,
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT COLUMN: CLEAN ELEVATED LOGIN CARD                      */}
          {/* ------------------------------------------------------------ */}
          <div
            className="login-form-column"
            style={{
              flex: '0 0 auto',
              width: '440px',
              maxWidth: '440px',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <div
              className="login-form-card"
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: '28px',
                border: '1px solid rgba(226, 232, 240, 0.95)',
                boxShadow: '0 24px 50px rgba(13, 148, 136, 0.08), 0 4px 15px rgba(0, 0, 0, 0.02)',
                padding: '2.25rem 2.25rem 2rem',
                position: 'relative',
                boxSizing: 'border-box',
                zIndex: 10
              }}
            >
              {/* Top Logo inside Login Card */}
              <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                <HospitalBrandLogo size={40} />
                <div>
                  <div
                    style={{
                      fontSize: '1.28rem',
                      fontWeight: 800,
                      color: '#1E293B',
                      lineHeight: 1.15,
                      letterSpacing: '-0.025em'
                    }}
                  >
                    LifeCare Hospital
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#64748B',
                      letterSpacing: '0.04em',
                      marginTop: '1px'
                    }}
                  >
                    Health • Care • Together
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="text-start mb-4 mt-2">
                <h2
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: '#1E293B',
                    margin: 0,
                    letterSpacing: '-0.02em'
                  }}
                >
                  Login to Your Account
                </h2>
                <p
                  style={{
                    color: '#64748B',
                    fontSize: '0.85rem',
                    margin: '0.35rem 0 0',
                    fontWeight: 450,
                    lineHeight: 1.45
                  }}
                >
                  Access your dashboard and manage your appointments, records and more.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                {/* Email Address Input */}
                <div className="mb-3">
                  <label
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: emailError ? '#DC2626' : '#334155',
                      marginBottom: '0.35rem',
                      display: 'block'
                    }}
                  >
                    Email Address
                  </label>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      border: `1.5px solid ${emailError ? '#EF4444' : '#CBD5E1'}`,
                      borderRadius: '12px',
                      padding: '0 0.95rem',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: emailError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <IoMailOutline size={19} style={{ color: emailError ? '#EF4444' : '#94A3B8', flexShrink: 0 }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      placeholder="Enter your email address"
                      style={{
                        width: '100%',
                        padding: '0.78rem 0.7rem',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '0.9rem',
                        color: '#1E293B',
                        fontWeight: 500
                      }}
                    />
                  </div>
                  {emailError && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#DC2626',
                        fontSize: '0.78rem',
                        marginTop: '0.35rem',
                        fontWeight: 600
                      }}
                    >
                      <IoAlertCircleOutline size={15} style={{ flexShrink: 0 }} />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                {/* Password Input */}
                <div className="mb-4">
                  <label
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: passwordError ? '#DC2626' : '#334155',
                      marginBottom: '0.35rem',
                      display: 'block'
                    }}
                  >
                    Password
                  </label>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      border: `1.5px solid ${passwordError ? '#EF4444' : '#CBD5E1'}`,
                      borderRadius: '12px',
                      padding: '0 0.95rem',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: passwordError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <IoLockClosedOutline size={19} style={{ color: passwordError ? '#EF4444' : '#94A3B8', flexShrink: 0 }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      placeholder="Enter your password"
                      style={{
                        width: '100%',
                        padding: '0.78rem 0.7rem',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '0.9rem',
                        color: '#1E293B',
                        fontWeight: 500
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: passwordError ? '#EF4444' : '#94A3B8',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <IoEyeOffOutline size={19} /> : <IoEyeOutline size={19} />}
                    </button>
                  </div>
                  {passwordError && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#DC2626',
                        fontSize: '0.78rem',
                        marginTop: '0.35rem',
                        fontWeight: 600
                      }}
                    >
                      <IoAlertCircleOutline size={15} style={{ flexShrink: 0 }} />
                      <span>{passwordError}</span>
                    </div>
                  )}
                </div>

                {/* Submit Login Button (Green Emerald Gradient with Arrow) */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(90deg, #10B981 0%, #0D9488 100%)',
                    color: '#FFFFFF',
                    fontSize: '1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 22px rgba(16, 185, 129, 0.28)',
                    transition: 'opacity 0.2s ease'
                  }}
                >
                  {loading ? (
                    <span>Signing In...</span>
                  ) : (
                    <>
                      <span>Login</span>
                      <IoArrowForward size={17} />
                    </>
                  )}
                </button>
              </form>

              {/* Data Security Assurance Footer */}
              <div
                style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  color: '#64748B',
                  fontSize: '0.73rem',
                  fontWeight: 500,
                  textAlign: 'center'
                }}
              >
                <IoShieldCheckmarkOutline size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                <span>Your data is safe with us. We follow strict privacy and security standards.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
