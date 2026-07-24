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
  RESET: 2,
  SUCCESS: 3
};

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 1: Request Reset Token
  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoading(true);
      const res = await forgotPassword(email);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        toast.success('Reset token generated! Valid for 15 minutes.');
      } else {
        toast.success(res.message || 'Reset token sent to your email.');
      }
      setStep(STEPS.RESET);
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Failed to request reset token');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken) {
      toast.error('Please enter the reset token');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword({ token: resetToken, password: newPassword });
      setStep(STEPS.SUCCESS);
      toast.success('Password successfully reset!');
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Failed to reset password');
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
                <p>Enter your email to generate a password reset token</p>
              </div>
              <form onSubmit={handleRequestToken} className={styles.form}>
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
                  {isLoading ? <Spinner size="sm" color="currentColor" /> : 'Generate Reset Token'}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 2: RESET */}
          {step === STEPS.RESET && (
            <div className={fpStyles.stepContent}>
              <div className={styles.header}>
                <h2>Reset Password</h2>
                <p>Enter your reset token and new password</p>
              </div>
              <form onSubmit={handleResetPassword} className={styles.form}>
                <Input
                  label="Reset Token"
                  type="text"
                  placeholder="Enter reset token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                  icon={<FiKey />}
                  disabled={isLoading}
                />
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
                <div className={fpStyles.resendWrapper}>
                  <button type="button" className={fpStyles.resendBtn} onClick={handleRequestToken} disabled={isLoading}>
                    Need a new reset token? Generate again
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === STEPS.SUCCESS && (
            <div className={fpStyles.successContent}>
              <div className={fpStyles.successIcon}>
                <FiCheckCircle size={48} />
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

          <div className={styles.footer}>
            <p>Secure Hospital Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
