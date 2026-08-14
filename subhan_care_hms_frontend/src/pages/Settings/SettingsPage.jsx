import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Card, CardBody, Button, Input, Badge, Avatar, Spinner, PasswordValidator, isPasswordValid } from '@/components/ui';
import {
  updateProfile,
  changePassword,
  verifyPasswordChangeOtp,
  confirmPasswordChange
} from '@/services/authService';
import { ROLE_LABELS } from '@/constants/roles';
import {
  User, Lock, Mail, Shield, CheckCircle, Sun, Moon,
  LogOut, Key, ArrowRight, ShieldCheck, Check, Sparkles, Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Settings.module.css';

const PWD_STEPS = {
  CURRENT: 1,
  OTP: 2,
  NEW_PWD: 3,
  SUCCESS: 4
};

const SettingsPage = () => {
  const { user, refreshUser, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Change Multi-Step State
  const [pwdStep, setPwdStep] = useState(PWD_STEPS.CURRENT);
  const [currentPassword, setCurrentPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPwd, setIsSubmittingPwd] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // Profile Update Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters long');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile({ name: name.trim() });
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Password Step 1: Verify Current Password
  const handleVerifyCurrentPassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    setIsSubmittingPwd(true);
    try {
      const res = await changePassword({ currentPassword });
      if (res.resetToken) {
        setDevOtp(res.resetToken);
        toast.success(`OTP generated & sent: ${res.resetToken}`);
      } else {
        toast.success('Verification OTP sent to your registered email');
      }
      setPwdStep(PWD_STEPS.OTP);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Incorrect current password');
    } finally {
      setIsSubmittingPwd(false);
    }
  };

  // Password Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    setIsSubmittingPwd(true);
    try {
      await verifyPasswordChangeOtp({ otp: otpCode });
      toast.success('OTP code verified successfully');
      setPwdStep(PWD_STEPS.NEW_PWD);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid or expired OTP code');
    } finally {
      setIsSubmittingPwd(false);
    }
  };

  // Password Step 3: Confirm New Password
  const handleConfirmNewPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !isPasswordValid(newPassword)) {
      toast.error('New password does not meet complexity requirements');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmittingPwd(true);
    try {
      await confirmPasswordChange({ otp: otpCode, newPassword });
      setPwdStep(PWD_STEPS.SUCCESS);
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setIsSubmittingPwd(false);
    }
  };

  const handleResetPwdFlow = () => {
    setPwdStep(PWD_STEPS.CURRENT);
    setCurrentPassword('');
    setOtpCode('');
    setDevOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const roleTitle = user?.role ? ROLE_LABELS[user.role] || user.role : 'User';

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Account & System Settings</h2>
        <p>Manage your profile information, password security, appearance, and active session.</p>
      </div>

      {/* SECTION 1: Profile Information */}
      <Card padding="24px">
        <div className={styles.sectionHeader}>
          <User size={20} style={{ color: 'var(--color-primary-600)' }} />
          Personal Profile Details
        </div>

        <form onSubmit={handleSaveProfile} className={styles.profileCardContent}>
          <div className={styles.profileTopRow}>
            <Avatar name={user?.name || 'User'} size="lg" />
            <div className={styles.profileBadgeGroup}>
              <div className={styles.profileName}>{user?.name || 'Hospital Staff'}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge variant="primary">{roleTitle}</Badge>
                <Badge variant={user?.status === 'active' ? 'success' : 'warning'}>
                  {user?.status ? user.status.toUpperCase() : 'ACTIVE'}
                </Badge>
              </div>
            </div>
          </div>

          <div className={styles.profileGrid}>
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              icon={<User size={16} />}
              disabled={isUpdatingProfile}
            />

            <div className={styles.readOnlyField}>
              <label className={styles.readOnlyLabel}>Email Address (Read-only)</label>
              <div className={styles.readOnlyBox}>
                <span>{user?.email || 'N/A'}</span>
                <Lock size={14} style={{ color: 'var(--color-neutral-400)' }} />
              </div>
              <span className={styles.fieldNotice}>Email address can only be modified by System Administrators.</span>
            </div>

            <div className={styles.readOnlyField}>
              <label className={styles.readOnlyLabel}>User ID / System ID</label>
              <div className={styles.readOnlyBox}>
                <strong>{user?.userId || 'SC-USER'}</strong>
              </div>
            </div>

            <div className={styles.readOnlyField}>
              <label className={styles.readOnlyLabel}>Last Login Session</label>
              <div className={styles.readOnlyBox}>
                <span>
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Active session'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="submit" variant="primary" loading={isUpdatingProfile}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* SECTION 2: Change Password (Multi-Step Secure Flow) */}
      <Card padding="24px">
        <div className={styles.sectionHeader}>
          <ShieldCheck size={20} style={{ color: 'var(--color-primary-700)' }} />
          Secure Password Change Verification
        </div>

        {/* Stepper Progress Bar */}
        <div className={styles.stepperWrapper}>
          <div className={styles.stepIndicator}>
            <div className={styles.stepItem}>
              <div className={`${styles.stepCircle} ${pwdStep === PWD_STEPS.CURRENT ? styles.stepActive : pwdStep > PWD_STEPS.CURRENT ? styles.stepCompleted : ''}`}>
                {pwdStep > PWD_STEPS.CURRENT ? <Check size={18} /> : '1'}
              </div>
              <span className={`${styles.stepLabel} ${pwdStep === PWD_STEPS.CURRENT ? styles.stepLabelActive : ''}`}>Current Pwd</span>
            </div>

            <div className={`${styles.stepLine} ${pwdStep > PWD_STEPS.CURRENT ? styles.stepLineCompleted : ''}`} />

            <div className={styles.stepItem}>
              <div className={`${styles.stepCircle} ${pwdStep === PWD_STEPS.OTP ? styles.stepActive : pwdStep > PWD_STEPS.OTP ? styles.stepCompleted : ''}`}>
                {pwdStep > PWD_STEPS.OTP ? <Check size={18} /> : '2'}
              </div>
              <span className={`${styles.stepLabel} ${pwdStep === PWD_STEPS.OTP ? styles.stepLabelActive : ''}`}>Email OTP</span>
            </div>

            <div className={`${styles.stepLine} ${pwdStep > PWD_STEPS.OTP ? styles.stepLineCompleted : ''}`} />

            <div className={styles.stepItem}>
              <div className={`${styles.stepCircle} ${pwdStep === PWD_STEPS.NEW_PWD ? styles.stepActive : pwdStep > PWD_STEPS.NEW_PWD ? styles.stepCompleted : ''}`}>
                {pwdStep > PWD_STEPS.NEW_PWD ? <Check size={18} /> : '3'}
              </div>
              <span className={`${styles.stepLabel} ${pwdStep === PWD_STEPS.NEW_PWD ? styles.stepLabelActive : ''}`}>New Password</span>
            </div>
          </div>
        </div>

        {/* STEP 1: Enter Current Password */}
        {pwdStep === PWD_STEPS.CURRENT && (
          <form onSubmit={handleVerifyCurrentPassword} className={styles.form}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-600)', margin: 0 }}>
              To ensure security, please enter your existing password first. We will send a 6-digit OTP code to your registered email address.
            </p>
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              icon={<Lock size={16} />}
              showPasswordToggle
              disabled={isSubmittingPwd}
            />
            <div>
              <Button type="submit" variant="primary" loading={isSubmittingPwd} icon={<ArrowRight size={16} />}>
                Verify & Send Email OTP
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Verify Email OTP */}
        {pwdStep === PWD_STEPS.OTP && (
          <form onSubmit={handleVerifyOtp} className={styles.form}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-600)', margin: 0 }}>
              A 6-digit verification code has been sent to <strong>{user?.email}</strong>. Please enter it below.
            </p>

            {devOtp && (
              <div className={styles.devBanner}>
                🔐 Dev Mode OTP Code: <strong>{devOtp}</strong>
              </div>
            )}

            <Input
              label="Verification OTP Code"
              placeholder="Enter 6-digit OTP"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
              icon={<Shield size={16} />}
              disabled={isSubmittingPwd}
            />

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Button type="submit" variant="primary" loading={isSubmittingPwd}>
                Verify OTP Code
              </Button>
              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleVerifyCurrentPassword}
                disabled={isSubmittingPwd}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Set New Password */}
        {pwdStep === PWD_STEPS.NEW_PWD && (
          <form onSubmit={handleConfirmNewPassword} className={styles.form}>
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              icon={<Lock size={16} />}
              showPasswordToggle
              disabled={isSubmittingPwd}
            />
            <PasswordValidator password={newPassword} />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              icon={<Lock size={16} />}
              showPasswordToggle
              disabled={isSubmittingPwd}
              error={newPassword && confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : null}
            />
            <div>
              <Button type="submit" variant="primary" loading={isSubmittingPwd}>
                Update Password
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: Success State */}
        {pwdStep === PWD_STEPS.SUCCESS && (
          <div className={styles.successBox}>
            <CheckCircle size={48} color="var(--color-success-500)" />
            <h3 className={styles.successTitle}>Password Updated Successfully</h3>
            <p className={styles.successText}>
              Your account password has been changed securely. Use your new credentials for future sign-ins.
            </p>
            <Button variant="outline" onClick={handleResetPwdFlow}>
              Done
            </Button>
          </div>
        )}
      </Card>

      {/* SECTION 3: Appearance & Theme */}
      <Card padding="24px">
        <div className={styles.sectionHeader}>
          <Sparkles size={20} style={{ color: 'var(--color-warning-500)' }} />
          Appearance & Application Theme
        </div>

        <div className={styles.themeToggleRow}>
          <div className={styles.themeInfo}>
            {isDark ? <Moon size={22} color="var(--color-primary-400)" /> : <Sun size={22} color="var(--color-warning-500)" />}
            <div>
              <div className={styles.themeTitle}>
                {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
              </div>
              <p className={styles.themeDesc}>
                Toggle between clear high-contrast light theme and calm eye-friendly dark mode.
              </p>
            </div>
          </div>

          <div
            className={`${styles.toggleSwitch} ${isDark ? styles.toggleSwitchActive : ''}`}
            onClick={toggleTheme}
            role="button"
            tabIndex={0}
            aria-label="Toggle theme"
          >
            <div className={`${styles.toggleKnob} ${isDark ? styles.toggleKnobActive : ''}`}>
              {isDark ? <Moon size={12} color="#0891b2" /> : <Sun size={12} color="#f59e0b" />}
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 4: Session & System Info */}
      <Card padding="24px">
        <div className={styles.sectionHeader}>
          <Monitor size={20} style={{ color: 'var(--color-neutral-700)' }} />
          Active Session & Security Summary
        </div>

        <div className={styles.profileGrid}>
          <div className={styles.readOnlyField}>
            <label className={styles.readOnlyLabel}>Session Timeout Limit</label>
            <div className={styles.readOnlyBox}>
              <span>15 Minutes Inactivity Lock</span>
            </div>
          </div>

          <div className={styles.readOnlyField}>
            <label className={styles.readOnlyLabel}>Browser / Client Device</label>
            <div className={styles.readOnlyBox}>
              <span style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 40) + '...' : 'Browser'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="danger" icon={<LogOut size={16} />} onClick={logout}>
            Sign Out of Account
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
