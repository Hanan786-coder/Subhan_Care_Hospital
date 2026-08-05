import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { forgotPassword, verifyOtp, resetPassword } from '@/services/authService';
import { Button, Input, Spinner, PasswordValidator, isPasswordValid } from '@/components/ui';
import { Mail, Key, Lock, ArrowLeft, CheckCircle, HeartPulse, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from '../Login/LoginPage.module.css';
import fpStyles from './ForgotPasswordPage.module.css';

const STEPS = {
  EMAIL: 1,
  OTP: 2,
  RESET: 3,
  SUCCESS: 4
};

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 1: Request Reset Token (OTP)
  const handleRequestToken = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMsg('Please enter your registered email address');
      return;
    }

    try {
      setIsLoading(true);
      const res = await forgotPassword(normalizedEmail);
      if (res.resetToken) {
        setGeneratedOtp(res.resetToken);
        toast.success(`Reset OTP generated: ${res.resetToken}`);
      } else {
        toast.success(res.message || 'Verification OTP sent to your email.');
      }
      setStep(STEPS.OTP);
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'No account found with this email address';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!otpCode) {
      setErrorMsg('Please enter the OTP code');
      toast.error('Please enter the OTP code');
      return;
    }

    try {
      setIsLoading(true);
      await verifyOtp(email.trim().toLowerCase(), otpCode);
      toast.success('OTP verified successfully!');
      setStep(STEPS.RESET);
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Invalid or expired OTP code';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newPassword || !isPasswordValid(newPassword)) {
      setErrorMsg('Password does not meet complexity requirements (min 8 chars, uppercase, lowercase, number, symbol)');
      toast.error('Password does not meet the complexity requirements');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword({ token: otpCode, password: newPassword });
      setStep(STEPS.SUCCESS);
      toast.success('Password successfully reset!');
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to reset password';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Panel - Branding */}
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <HeartPulse size={30} color="#ffffff" />
            </div>
            <h1>Subhan Care</h1>
          </div>
          <p className={styles.tagline}>
            Secure password recovery. We ensure your account and patient data stay protected.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.mobileLogo}>
            <div className={styles.logoIcon}>
              <HeartPulse size={24} color="#ffffff" />
            </div>
            <h2>Subhan Care</h2>
          </div>

          {step !== STEPS.SUCCESS && (
            <Link to={PUBLIC_ROUTES.LOGIN} className={fpStyles.backLink}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          )}

          {errorMsg && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          {/* STEP 1: EMAIL */}
          {step === STEPS.EMAIL && (
            <div className={fpStyles.stepContent}>
              <div className={styles.header}>
                <h2>Forgot Password</h2>
                <p>Enter your registered email address to receive a secure password reset OTP</p>
              </div>
              <form onSubmit={handleRequestToken} className={styles.form}>
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  icon={<Mail size={18} />}
                  disabled={isLoading}
                />
                <Button type="submit" variant="primary" fullWidth size="lg" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" color="currentColor" /> : 'Generate Reset OTP'}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === STEPS.OTP && (
            <div className={fpStyles.stepContent}>
              <div className={styles.header}>
                <h2>Verify OTP</h2>
                <p>Enter the 6-digit OTP code sent to {email}</p>
              </div>

              {generatedOtp && (
                <div style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1e40af',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  🔐 Dev Mode OTP: <strong>{generatedOtp}</strong>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className={styles.form}>
                <Input
                  label="Verification OTP"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  icon={<ShieldCheck size={18} />}
                  disabled={isLoading}
                />
                <Button type="submit" variant="primary" fullWidth size="lg" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" color="currentColor" /> : 'Verify OTP'}
                </Button>
                <div className={fpStyles.resendWrapper}>
                  <button type="button" className={fpStyles.resendBtn} onClick={handleRequestToken} disabled={isLoading}>
                    Didn't receive OTP? Resend code
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: RESET PASSWORD */}
          {step === STEPS.RESET && (
            <div className={fpStyles.stepContent}>
              <div className={styles.header}>
                <h2>New Password</h2>
                <p>Enter your new secure password</p>
              </div>
              <form onSubmit={handleResetPassword} className={styles.form}>
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  icon={<Lock size={18} />}
                  disabled={isLoading}
                  showPasswordToggle
                />
                <PasswordValidator password={newPassword} />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  icon={<Lock size={18} />}
                  disabled={isLoading}
                  showPasswordToggle
                  error={newPassword && confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : null}
                />
                <Button type="submit" variant="primary" fullWidth size="lg" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" color="currentColor" /> : 'Reset Password'}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === STEPS.SUCCESS && (
            <div className={fpStyles.successContent}>
              <div className={fpStyles.successIcon}>
                <CheckCircle size={48} color="var(--color-secondary-500)" />
              </div>
              <h2>Password Reset Successful</h2>
              <p>Your password has been updated. You can now use your new password to sign in.</p>
              <Button 
                variant="primary" 
                fullWidth 
                size="lg" 
                onClick={() => navigate(PUBLIC_ROUTES.LOGIN)}
                className={fpStyles.successBtn}
              >
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
