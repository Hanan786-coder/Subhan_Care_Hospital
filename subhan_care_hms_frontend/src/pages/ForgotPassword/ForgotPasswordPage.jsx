import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { forgotPassword, verifyOtp, resetPassword } from '@/services/authService';
import { Button, Input, Spinner } from '@/components/ui';
import { FiMail, FiKey, FiLock, FiArrowLeft, FiCheckCircle, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import styles from '../Login/LoginPage.module.css'; // Reusing login layout styles
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
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoading(true);
      await forgotPassword(email);
      toast.success('Reset code sent to your email');
      setStep(STEPS.OTP);
    } catch (error) {
      toast.error(error.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;

    try {
      setIsLoading(true);
      await verifyOtp(email, otp);
      toast.success('Code verified successfully');
      setStep(STEPS.RESET);
    } catch (error) {
      toast.error(error.message || 'Invalid or expired code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword({ email, otp, newPassword });
      setStep(STEPS.SUCCESS);
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Panel - Branding (Reused) */}
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <FiActivity size={32} />
            </div>
            <h1>Subhan Care HMS</h1>
          </div>
          <p className={styles.tagline}>
            Secure password recovery. We ensure your account and patient data stay protected.
          </p>
        </div>
        <div className={styles.brandDecoration}></div>
      </div>

      {/* Right Panel - Form */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.mobileLogo}>
            <div className={styles.logoIcon}>
              <FiActivity size={24} />
            </div>
            <h2>Subhan Care</h2>
          </div>

          <Link to={PUBLIC_ROUTES.LOGIN} className={fpStyles.backLink}>
            <FiArrowLeft /> Back to Login
          </Link>

          {/* STEP 1: EMAIL */}
          {step === STEPS.EMAIL && (
            <div className={fpStyles.stepContent}>
              <div className={styles.header}>
                <h2>Forgot Password</h2>
                <p>Enter your email to receive a password reset code</p>
              </div>
              <form onSubmit={handleRequestOtp} className={styles.form}>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  icon={<FiMail />}
                  disabled={isLoading}
                />
                <Button type="submit" variant="primary" fullWidth size="lg" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" color="currentColor" /> : 'Send Reset Code'}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 2: OTP */}
          {step === STEPS.OTP && (
            <div className={fpStyles.stepContent}>
              <div className={styles.header}>
                <h2>Verify Code</h2>
                <p>Enter the 6-digit code sent to <strong>{email}</strong></p>
              </div>
              <form onSubmit={handleVerifyOtp} className={styles.form}>
                <Input
                  label="Verification Code"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  icon={<FiKey />}
                  disabled={isLoading}
                  className={fpStyles.otpInput}
                />
                <Button type="submit" variant="primary" fullWidth size="lg" disabled={isLoading || otp.length < 6}>
                  {isLoading ? <Spinner size="sm" color="currentColor" /> : 'Verify Code'}
                </Button>
                <div className={fpStyles.resendWrapper}>
                  <button type="button" className={fpStyles.resendBtn} onClick={handleRequestOtp} disabled={isLoading}>
                    Didn't receive the code? Resend
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: RESET */}
          {step === STEPS.RESET && (
            <div className={fpStyles.stepContent}>
              <div className={styles.header}>
                <h2>Create New Password</h2>
                <p>Your new password must be different from previous ones</p>
              </div>
              <form onSubmit={handleResetPassword} className={styles.form}>
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  icon={<FiLock />}
                  disabled={isLoading}
                  showPasswordToggle
                  helper="Must be at least 8 characters"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  icon={<FiLock />}
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
                <FiCheckCircle size={48} />
              </div>
              <h2>Password Reset Successful</h2>
              <p>Your password has been changed successfully. You can now use your new password to log in.</p>
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

          <div className={styles.footer}>
            <p>Secure Hospital Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
