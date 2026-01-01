import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ==================== TRANSLATIONS ====================
const translations = {
  de: {
    // Headers
    login: 'Anmelden',
    register: 'Registrieren',
    resetPassword: 'Passwort zurücksetzen',
    newPassword: 'Neues Passwort setzen',
    emailLogin: 'Login mit E-Mail-Code',
    verifyCode: 'Code bestätigen',
    
    // Fields
    email: 'E-Mail',
    password: 'Passwort',
    confirmPassword: 'Passwort bestätigen',
    username: 'Benutzername',
    code: '6-stelliger Code',
    
    // Placeholders
    emailPlaceholder: 'deine@email.com',
    passwordPlaceholder: 'Mindestens 12 Zeichen',
    usernamePlaceholder: 'Dein Anzeigename',
    codePlaceholder: '123456',
    
    // Buttons
    loginBtn: 'Anmelden',
    registerBtn: 'Registrieren',
    sendResetLink: 'Reset-Link senden',
    sendCode: 'Code senden',
    verifyBtn: 'Bestätigen',
    setNewPassword: 'Passwort speichern',
    cancel: 'Abbrechen',
    resendCode: 'Code erneut senden',
    
    // Links
    forgotPassword: 'Passwort vergessen?',
    noAccount: 'Noch kein Konto?',
    hasAccount: 'Bereits ein Konto?',
    backToLogin: 'Zurück zum Login',
    loginWithCode: 'Login mit E-Mail-Code (ohne Passwort)',
    loginWithPassword: 'Login mit Passwort',
    
    // Messages
    resetLinkSent: 'Reset-Link wurde an deine E-Mail gesendet!',
    codeSent: 'Code wurde an deine E-Mail gesendet!',
    checkEmail: 'Bitte überprüfe dein E-Mail-Postfach.',
    codeExpiry: 'Der Code ist 1 Stunde gültig.',
    passwordUpdated: 'Passwort erfolgreich geändert!',
    registrationSuccess: 'Registrierung erfolgreich! Bitte bestätige deine E-Mail.',
    
    // Errors
    errorInvalidEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    errorPasswordShort: 'Passwort muss mindestens 6 Zeichen haben.',
    errorPasswordMatch: 'Passwörter stimmen nicht überein.',
    errorInvalidCode: 'Ungültiger Code. Bitte versuche es erneut.',
    errorGeneric: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
    errorUserExists: 'Diese E-Mail ist bereits registriert.',
    errorInvalidCredentials: 'Ungültige E-Mail oder Passwort.',
    errorRateLimit: 'Zu viele Versuche. Bitte warte 60 Sekunden.',
    errorUsernameTaken: 'Dieser Benutzername ist bereits vergeben.',
    errorUsernameShort: 'Benutzername muss mindestens 3 Zeichen haben.',
    errorUsernameInvalid: 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten.',
    errorPasswordWeak: 'Passwort zu schwach. Mind. 12 Zeichen mit 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl und 1 Sonderzeichen.',
    checkingUsername: 'Prüfe Verfügbarkeit...',
    usernameAvailable: '✓ Verfügbar',
    
    // Info
    or: 'oder',
    secureLogin: '🔒 Sichere Verbindung',
  },
  en: {
    // Headers
    login: 'Login',
    register: 'Register',
    resetPassword: 'Reset Password',
    newPassword: 'Set New Password',
    emailLogin: 'Login with Email Code',
    verifyCode: 'Verify Code',
    
    // Fields
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    username: 'Username',
    code: '6-digit Code',
    
    // Placeholders
    emailPlaceholder: 'your@email.com',
    passwordPlaceholder: 'At least 12 characters',
    usernamePlaceholder: 'Your display name',
    codePlaceholder: '123456',
    
    // Buttons
    loginBtn: 'Login',
    registerBtn: 'Register',
    sendResetLink: 'Send Reset Link',
    sendCode: 'Send Code',
    verifyBtn: 'Verify',
    setNewPassword: 'Save Password',
    cancel: 'Cancel',
    resendCode: 'Resend Code',
    
    // Links
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    backToLogin: 'Back to Login',
    loginWithCode: 'Login with Email Code (no password)',
    loginWithPassword: 'Login with Password',
    
    // Messages
    resetLinkSent: 'Reset link sent to your email!',
    codeSent: 'Code sent to your email!',
    checkEmail: 'Please check your email inbox.',
    codeExpiry: 'The code is valid for 1 hour.',
    passwordUpdated: 'Password updated successfully!',
    registrationSuccess: 'Registration successful! Please confirm your email.',
    
    // Errors
    errorInvalidEmail: 'Please enter a valid email address.',
    errorPasswordShort: 'Password must be at least 6 characters.',
    errorPasswordMatch: 'Passwords do not match.',
    errorInvalidCode: 'Invalid code. Please try again.',
    errorGeneric: 'An error occurred. Please try again.',
    errorUserExists: 'This email is already registered.',
    errorInvalidCredentials: 'Invalid email or password.',
    errorRateLimit: 'Too many attempts. Please wait 60 seconds.',
    errorUsernameTaken: 'This username is already taken.',
    errorUsernameShort: 'Username must be at least 3 characters.',
    errorUsernameInvalid: 'Username can only contain letters, numbers, and underscores.',
    errorPasswordWeak: 'Password too weak. Min. 12 chars with 1 uppercase, 1 lowercase, 1 number, and 1 special character.',
    checkingUsername: 'Checking availability...',
    usernameAvailable: '✓ Available',
    
    // Info
    or: 'or',
    secureLogin: '🔒 Secure Connection',
  },
  pl: {
    // Headers
    login: 'Zaloguj się',
    register: 'Zarejestruj się',
    resetPassword: 'Zresetuj hasło',
    newPassword: 'Ustaw nowe hasło',
    emailLogin: 'Logowanie kodem e-mail',
    verifyCode: 'Potwierdź kod',
    
    // Fields
    email: 'E-mail',
    password: 'Hasło',
    confirmPassword: 'Potwierdź hasło',
    username: 'Nazwa użytkownika',
    code: '6-cyfrowy kod',
    
    // Placeholders
    emailPlaceholder: 'twoj@email.com',
    passwordPlaceholder: 'Minimum 12 znaków',
    usernamePlaceholder: 'Twoja wyświetlana nazwa',
    codePlaceholder: '123456',
    
    // Buttons
    loginBtn: 'Zaloguj',
    registerBtn: 'Zarejestruj',
    sendResetLink: 'Wyślij link resetujący',
    sendCode: 'Wyślij kod',
    verifyBtn: 'Potwierdź',
    setNewPassword: 'Zapisz hasło',
    cancel: 'Anuluj',
    resendCode: 'Wyślij kod ponownie',
    
    // Links
    forgotPassword: 'Zapomniałeś hasła?',
    noAccount: 'Nie masz konta?',
    hasAccount: 'Masz już konto?',
    backToLogin: 'Wróć do logowania',
    loginWithCode: 'Logowanie kodem e-mail (bez hasła)',
    loginWithPassword: 'Logowanie hasłem',
    
    // Messages
    resetLinkSent: 'Link resetujący wysłany na Twój e-mail!',
    codeSent: 'Kod wysłany na Twój e-mail!',
    checkEmail: 'Sprawdź swoją skrzynkę e-mail.',
    codeExpiry: 'Kod jest ważny przez 1 godzinę.',
    passwordUpdated: 'Hasło zaktualizowane pomyślnie!',
    registrationSuccess: 'Rejestracja udana! Potwierdź swój e-mail.',
    
    // Errors
    errorInvalidEmail: 'Podaj prawidłowy adres e-mail.',
    errorPasswordShort: 'Hasło musi mieć co najmniej 6 znaków.',
    errorPasswordMatch: 'Hasła nie są zgodne.',
    errorInvalidCode: 'Nieprawidłowy kod. Spróbuj ponownie.',
    errorGeneric: 'Wystąpił błąd. Spróbuj ponownie.',
    errorUserExists: 'Ten e-mail jest już zarejestrowany.',
    errorInvalidCredentials: 'Nieprawidłowy e-mail lub hasło.',
    errorRateLimit: 'Zbyt wiele prób. Poczekaj 60 sekund.',
    errorUsernameTaken: 'Ta nazwa użytkownika jest już zajęta.',
    errorUsernameShort: 'Nazwa użytkownika musi mieć co najmniej 3 znaki.',
    errorUsernameInvalid: 'Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślniki.',
    errorPasswordWeak: 'Hasło za słabe. Min. 12 znaków z 1 wielką literą, 1 małą literą, 1 cyfrą i 1 znakiem specjalnym.',
    checkingUsername: 'Sprawdzanie dostępności...',
    usernameAvailable: '✓ Dostępna',
    
    // Info
    or: 'lub',
    secureLogin: '🔒 Bezpieczne połączenie',
  }
};

// ==================== MAIN COMPONENT ====================
export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login', language = 'de' }) {
  const t = (key) => translations[language]?.[key] || translations['de'][key] || key;
  
  // States
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'reset', 'otp', 'verify', 'newPassword'
  const [socialLoading, setSocialLoading] = useState(null); // 'google', 'github', etc.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpEmail, setOtpEmail] = useState(''); // Email used for OTP verification
  const [usernameStatus, setUsernameStatus] = useState(null); // null, 'checking', 'available', 'taken', 'invalid', 'short'
  
  // Check username availability (debounced)
  useEffect(() => {
    if (mode !== 'register' || !username.trim()) {
      setUsernameStatus(null);
      return;
    }
    
    const trimmedUsername = username.trim();
    
    // Validate format: only letters, numbers, underscores
    if (!/^[a-zA-Z0-9_äöüÄÖÜß]+$/.test(trimmedUsername)) {
      setUsernameStatus('invalid');
      return;
    }
    
    // Minimum length
    if (trimmedUsername.length < 3) {
      setUsernameStatus('short');
      return;
    }
    
    setUsernameStatus('checking');
    
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', trimmedUsername)
          .maybeSingle();
        
        if (error) {
          console.error('Username check error:', error);
          setUsernameStatus(null);
        } else if (data) {
          setUsernameStatus('taken');
        } else {
          setUsernameStatus('available');
        }
      } catch (err) {
        console.error('Username check error:', err);
        setUsernameStatus(null);
      }
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timer);
  }, [username, mode]);
  
  // Reset form when mode changes
  useEffect(() => {
    setError('');
    setSuccess('');
    setOtpCode('');
    setUsernameStatus(null);
  }, [mode]);
  
  // Reset form when modal opens OR sync with initialMode
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      // Only clear form fields when opening fresh (not for password recovery)
      if (initialMode !== 'newPassword') {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        setOtpCode('');
      } else {
        // For password recovery, only clear password fields
        setPassword('');
        setConfirmPassword('');
      }
      setError('');
      setSuccess('');
      setUsernameStatus(null);
    }
  }, [isOpen, initialMode]);

  // ==================== AUTH FUNCTIONS ====================
  
  // Standard Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError(t('errorInvalidCredentials'));
        } else {
          setError(error.message);
        }
      } else if (data.user) {
        onSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError(t('errorGeneric'));
    }
    setLoading(false);
  };
  
  // Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedUsername = username.trim();
    
    // Username validation
    if (!trimmedUsername) {
      setError(t('errorUsernameShort'));
      return;
    }
    if (trimmedUsername.length < 3) {
      setError(t('errorUsernameShort'));
      return;
    }
    if (!/^[a-zA-Z0-9_äöüÄÖÜß]+$/.test(trimmedUsername)) {
      setError(t('errorUsernameInvalid'));
      return;
    }
    if (usernameStatus === 'taken') {
      setError(t('errorUsernameTaken'));
      return;
    }
    if (usernameStatus === 'checking') {
      setError(t('checkingUsername'));
      return;
    }
    
    if (password.length < 12) {
      setError(t('errorPasswordWeak'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('errorPasswordMatch'));
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: trimmedUsername,
          }
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          setError(t('errorUserExists'));
        } else if (error.message.includes('Password should') || error.message.includes('at least')) {
          setError(t('errorPasswordWeak'));
        } else {
          setError(error.message);
        }
      } else {
        setSuccess(t('registrationSuccess'));
        // If email confirmation is disabled, user is logged in immediately
        if (data.user && data.session) {
          setTimeout(() => {
            onSuccess(data.user);
            onClose();
          }, 2000);
        }
      }
    } catch (err) {
      setError(t('errorGeneric'));
    }
    setLoading(false);
  };
  
  // Send Password Reset Email
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      
      if (error) {
        if (error.message.includes('rate limit')) {
          setError(t('errorRateLimit'));
        } else {
          setError(error.message);
        }
      } else {
        setSuccess(t('resetLinkSent'));
      }
    } catch (err) {
      setError(t('errorGeneric'));
    }
    setLoading(false);
  };
  
  // Set New Password (after clicking reset link)
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 12) {
      setError(t('errorPasswordWeak'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('errorPasswordMatch'));
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(t('passwordUpdated'));
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(t('errorGeneric'));
    }
    setLoading(false);
  };
  
  // Send OTP Code to Email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true, // Auto-create user if doesn't exist
        }
      });
      
      if (error) {
        if (error.message.includes('rate limit')) {
          setError(t('errorRateLimit'));
        } else {
          setError(error.message);
        }
      } else {
        setOtpEmail(email.trim());
        setSuccess(t('codeSent'));
        setMode('verify');
      }
    } catch (err) {
      setError(t('errorGeneric'));
    }
    setLoading(false);
  };
  
  // Verify OTP Code
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otpCode.trim(),
        type: 'email',
      });
      
      if (error) {
        setError(t('errorInvalidCode'));
      } else if (data.user) {
        onSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError(t('errorGeneric'));
    }
    setLoading(false);
  };
  
  // Resend OTP Code
  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
      });
      
      if (error) {
        if (error.message.includes('rate limit')) {
          setError(t('errorRateLimit'));
        } else {
          setError(error.message);
        }
      } else {
        setSuccess(t('codeSent'));
      }
    } catch (err) {
      setError(t('errorGeneric'));
    }
    setLoading(false);
  };

  // Social Login (Google, GitHub, etc.)
  const handleSocialLogin = async (provider) => {
    setError('');
    setSocialLoading(provider);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin,
        }
      });
      
      if (error) {
        setError(error.message);
        setSocialLoading(null);
      }
      // Note: On success, user will be redirected to provider's page
    } catch (err) {
      setError(t('errorGeneric'));
      setSocialLoading(null);
    }
  };

  // ==================== STYLES ====================
  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    },
    modal: {
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      borderRadius: 16, padding: 28, width: '100%', maxWidth: 400,
      border: '1px solid #334155', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      maxHeight: '90vh', overflowY: 'auto',
    },
    header: {
      textAlign: 'center', marginBottom: 24,
    },
    title: {
      fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 6,
    },
    subtitle: {
      fontSize: 12, color: '#64748b',
    },
    form: {
      display: 'flex', flexDirection: 'column', gap: 16,
    },
    inputGroup: {
      display: 'flex', flexDirection: 'column', gap: 6,
    },
    label: {
      fontSize: 12, color: '#94a3b8', fontWeight: '500',
    },
    input: {
      padding: '12px 14px', background: '#0f172a', border: '1px solid #334155',
      borderRadius: 8, color: 'white', fontSize: 14, outline: 'none',
      transition: 'border-color 0.2s',
    },
    button: {
      padding: '14px 20px', background: 'linear-gradient(135deg, #10b981, #059669)',
      border: 'none', borderRadius: 8, color: 'white', fontSize: 14,
      fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s',
    },
    buttonSecondary: {
      padding: '12px 16px', background: 'transparent',
      border: '1px solid #334155', borderRadius: 8, color: '#94a3b8',
      fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
    },
    buttonOTP: {
      padding: '12px 16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      border: 'none', borderRadius: 8, color: 'white', fontSize: 12,
      fontWeight: 'bold', cursor: 'pointer', width: '100%',
    },
    link: {
      color: '#10b981', cursor: 'pointer', fontSize: 12, textDecoration: 'none',
      fontWeight: '500',
    },
    error: {
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#f87171',
      textAlign: 'center',
    },
    success: {
      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#34d399',
      textAlign: 'center',
    },
    divider: {
      display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0',
    },
    dividerLine: {
      flex: 1, height: 1, background: '#334155',
    },
    dividerText: {
      fontSize: 11, color: '#64748b', textTransform: 'uppercase',
    },
    otpInput: {
      padding: '16px 14px', background: '#0f172a', border: '1px solid #334155',
      borderRadius: 8, color: 'white', fontSize: 24, fontWeight: 'bold',
      textAlign: 'center', letterSpacing: 8, outline: 'none',
    },
    closeButton: {
      position: 'absolute', top: 12, right: 12, background: 'none',
      border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20,
      padding: 4,
    },
    footer: {
      marginTop: 20, textAlign: 'center', fontSize: 11, color: '#475569',
    },
  };

  // Don't render if not open
  if (!isOpen) return null;

  // ==================== RENDER FUNCTIONS ====================
  
  // Login Form
  const renderLogin = () => (
    <form onSubmit={handleLogin} style={styles.form}>
      <div style={styles.inputGroup}>
        <label style={styles.label}>{t('email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          style={styles.input}
          required
          autoFocus
        />
      </div>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>{t('password')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          style={styles.input}
          required
        />
      </div>
      
      <div style={{ textAlign: 'right' }}>
        <span style={styles.link} onClick={() => setMode('reset')}>
          {t('forgotPassword')}
        </span>
      </div>
      
      <button type="submit" style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} disabled={loading}>
        {loading ? '...' : t('loginBtn')}
      </button>
      
      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>{t('or')}</span>
        <div style={styles.dividerLine} />
      </div>
      
      <button type="button" style={styles.buttonOTP} onClick={() => setMode('otp')}>
        📧 {t('loginWithCode')}
      </button>
      
      {/* Social Login Buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button 
          type="button" 
          onClick={() => handleSocialLogin('google')}
          disabled={socialLoading === 'google'}
          style={{ 
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 16px', background: 'white', border: 'none', borderRadius: 8, 
            color: '#1f2937', fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
            opacity: socialLoading === 'google' ? 0.7 : 1
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {socialLoading === 'google' ? '...' : (language === 'de' ? 'Mit Google anmelden' : 'Sign in with Google')}
        </button>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>{t('noAccount')} </span>
        <span style={styles.link} onClick={() => setMode('register')}>
          {t('register')}
        </span>
      </div>
    </form>
  );
  
  // Register Form
  const renderRegister = () => (
    <form onSubmit={handleRegister} style={styles.form}>
      <div style={styles.inputGroup}>
        <label style={styles.label}>{t('username')}</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('usernamePlaceholder')}
          style={{
            ...styles.input,
            borderColor: usernameStatus === 'available' ? '#10b981' : 
                        usernameStatus === 'taken' ? '#ef4444' : 
                        usernameStatus === 'invalid' || usernameStatus === 'short' ? '#f59e0b' : '#334155'
          }}
          required
          maxLength={20}
        />
        {/* Username Requirements Hint */}
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
          {language === 'de' 
            ? '3-20 Zeichen • Buchstaben, Zahlen, Unterstriche' 
            : '3-20 characters • Letters, numbers, underscores'}
        </div>
        {/* Username Status Indicator */}
        {usernameStatus && (
          <div style={{ 
            fontSize: 11, 
            marginTop: 2,
            color: usernameStatus === 'available' ? '#10b981' : 
                   usernameStatus === 'taken' ? '#ef4444' : 
                   usernameStatus === 'checking' ? '#64748b' : '#f59e0b'
          }}>
            {usernameStatus === 'checking' && t('checkingUsername')}
            {usernameStatus === 'available' && t('usernameAvailable')}
            {usernameStatus === 'taken' && t('errorUsernameTaken')}
            {usernameStatus === 'short' && t('errorUsernameShort')}
            {usernameStatus === 'invalid' && t('errorUsernameInvalid')}
          </div>
        )}
      </div>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>{t('email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          style={styles.input}
          required
        />
      </div>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>{t('password')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          style={styles.input}
          required
          minLength={12}
          maxLength={72}
        />
        {/* Password Requirements Hint */}
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
          {language === 'de' 
            ? 'Mind. 12 Zeichen: 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl, 1 Sonderzeichen' 
            : 'Min. 12 chars: 1 uppercase, 1 lowercase, 1 number, 1 special character'}
        </div>
      </div>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>{t('confirmPassword')}</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          style={styles.input}
          required
        />
      </div>
      
      <button 
        type="submit" 
        style={{ 
          ...styles.button, 
          opacity: loading || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'short' ? 0.7 : 1 
        }} 
        disabled={loading || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'short'}
      >
        {loading ? '...' : t('registerBtn')}
      </button>
      
      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>{t('or')}</span>
        <div style={styles.dividerLine} />
      </div>
      
      {/* Social Login Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          type="button" 
          onClick={() => handleSocialLogin('google')}
          disabled={socialLoading === 'google'}
          style={{ 
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 16px', background: 'white', border: 'none', borderRadius: 8, 
            color: '#1f2937', fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
            opacity: socialLoading === 'google' ? 0.7 : 1
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {language === 'de' ? 'Mit Google registrieren' : 'Sign up with Google'}
        </button>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>{t('hasAccount')} </span>
        <span style={styles.link} onClick={() => setMode('login')}>
          {t('login')}
        </span>
      </div>
    </form>
  );
  
  // Password Reset Form
  const renderReset = () => (
    <form onSubmit={handleResetPassword} style={styles.form}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 40 }}>🔑</span>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          {t('checkEmail')}
        </p>
      </div>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>{t('email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          style={styles.input}
          required
          autoFocus
        />
      </div>
      
      <button type="submit" style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} disabled={loading}>
        {loading ? '...' : t('sendResetLink')}
      </button>
      
      <button type="button" style={styles.buttonSecondary} onClick={() => setMode('login')}>
        ← {t('backToLogin')}
      </button>
    </form>
  );
  
  // New Password Form (after clicking reset link)
  const renderNewPassword = () => (
    <form onSubmit={handleSetNewPassword} style={styles.form}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 40 }}>🔐</span>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          {language === 'de' 
            ? 'Gib dein neues Passwort ein.' 
            : 'Enter your new password.'}
        </p>
      </div>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>{t('password')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          style={styles.input}
          required
          autoFocus
        />
      </div>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>{t('confirmPassword')}</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          style={styles.input}
          required
        />
      </div>
      
      <button type="submit" style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} disabled={loading}>
        {loading ? '...' : t('setNewPassword')}
      </button>
    </form>
  );
  
  // OTP Email Input Form
  const renderOTPEmail = () => (
    <form onSubmit={handleSendOTP} style={styles.form}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 40 }}>📧</span>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          {language === 'de' 
            ? 'Wir senden dir einen 6-stelligen Code per E-Mail.'
            : "We'll send you a 6-digit code via email."}
        </p>
      </div>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>{t('email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          style={styles.input}
          required
          autoFocus
        />
      </div>
      
      <button type="submit" style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} disabled={loading}>
        {loading ? '...' : t('sendCode')}
      </button>
      
      <button type="button" style={styles.buttonSecondary} onClick={() => setMode('login')}>
        ← {t('loginWithPassword')}
      </button>
    </form>
  );
  
  // OTP Code Verification Form
  const renderVerifyOTP = () => (
    <form onSubmit={handleVerifyOTP} style={styles.form}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 40 }}>🔢</span>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          {language === 'de'
            ? `Code gesendet an ${otpEmail}`
            : `Code sent to ${otpEmail}`}
        </p>
        <p style={{ fontSize: 11, color: '#64748b' }}>{t('codeExpiry')}</p>
      </div>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>{t('code')}</label>
        <input
          type="text"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder={t('codePlaceholder')}
          style={styles.otpInput}
          required
          autoFocus
          maxLength={6}
        />
      </div>
      
      <button type="submit" style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} disabled={loading || otpCode.length !== 6}>
        {loading ? '...' : t('verifyBtn')}
      </button>
      
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={{ ...styles.buttonSecondary, flex: 1 }} onClick={() => setMode('otp')}>
          ← {t('cancel')}
        </button>
        <button type="button" style={{ ...styles.buttonSecondary, flex: 1 }} onClick={handleResendOTP} disabled={loading}>
          🔄 {t('resendCode')}
        </button>
      </div>
    </form>
  );

  // ==================== MAIN RENDER ====================
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button style={styles.closeButton} onClick={onClose}>✕</button>
        
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            {mode === 'login' && `⚽ ${t('login')}`}
            {mode === 'register' && `⚽ ${t('register')}`}
            {mode === 'reset' && `🔑 ${t('resetPassword')}`}
            {mode === 'newPassword' && `🔐 ${t('newPassword')}`}
            {mode === 'otp' && `📧 ${t('emailLogin')}`}
            {mode === 'verify' && `🔢 ${t('verifyCode')}`}
          </div>
          <div style={styles.subtitle}>WM 2026 Tippspiel</div>
        </div>
        
        {/* Error Message */}
        {error && <div style={{ ...styles.error, marginBottom: 16 }}>{error}</div>}
        
        {/* Success Message - Show only message, hide form */}
        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ ...styles.success, marginBottom: 16 }}>{success}</div>
            {mode !== 'newPassword' && (
              <button 
                type="button" 
                style={styles.buttonSecondary} 
                onClick={() => { setSuccess(''); setMode('login'); }}
              >
                {language === 'de' ? '← Zum Login' : '← Back to Login'}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Forms */}
            {mode === 'login' && renderLogin()}
            {mode === 'register' && renderRegister()}
            {mode === 'reset' && renderReset()}
            {mode === 'newPassword' && renderNewPassword()}
            {mode === 'otp' && renderOTPEmail()}
            {mode === 'verify' && renderVerifyOTP()}
          </>
        )}
        
        {/* Footer */}
        <div style={styles.footer}>
          {t('secureLogin')}
        </div>
      </div>
    </div>
  );
}
