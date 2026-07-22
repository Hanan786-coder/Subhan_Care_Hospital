import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PUBLIC_ROUTES, PRIVATE_ROUTES } from '@/constants/routes';
import { Button, Input, Spinner } from '@/components/ui';
import { HeartPulse, Mail, Lock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './LoginPage.module.css';

const DEMO_ACCOUNTS = [
  { email: 'admin@subhancare.com', role: 'System Admin', color: '#2563eb' },
  { email: 'dr.ahmed@subhancare.com', role: 'Doctor', color: '#22c55e' },
  { email: 'reception@subhancare.com', role: 'Receptionist', color: '#f59e0b' },
  { email: 'pharma@subhancare.com', role: 'Pharmacist', color: '#8b5cf6' },
  { email: 'billing@subhancare.com', role: 'Billing Staff', color: '#ef4444' },
];

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      toast.success('Signed in successfully');
      navigate(PRIVATE_ROUTES.DASHBOARD, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className={styles.container}>
      {/* Left Panel - Brand Header & Demo Roles */}
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <HeartPulse size={30} color="#ffffff" />
            </div>
            <h1>Subhan Care</h1>
          </div>
          <p className={styles.tagline}>
            Hospital Management System — Comprehensive digital solution for clinical workflows, patient records, and billing.
          </p>

          {/* Quick Demo Login Cards */}
          <div className={styles.demoSection}>
            <div className={styles.demoHeader}>
              <Shield size={16} color="var(--color-primary-300)" />
              <h3 className={styles.demoTitle}>RBAC Demo Accounts (SRS Sec 4)</h3>
            </div>
            <p className={styles.demoDesc}>Click a role to auto-fill credentials for testing:</p>
            <div className={styles.demoList}>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  className={styles.demoItem}
                  onClick={() => handleDemoLogin(acc.email)}
                  type="button"
                >
                  <span className={styles.demoDot} style={{ background: acc.color }}></span>
                  <span className={styles.demoRole}>{acc.role}</span>
                  <span className={styles.demoEmail}>{acc.email}</span>
                </button>
              ))}
            </div>
            <p className={styles.demoPassword}>Password for all: <code>password123</code></p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.mobileLogo}>
            <div className={styles.logoIcon}>
              <HeartPulse size={24} color="#ffffff" />
            </div>
            <h2>Subhan Care</h2>
          </div>

          <div className={styles.header}>
            <h2>Welcome Back</h2>
            <p>Please enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email Address"
              type="email"
              placeholder="name@subhancare.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<Mail size={18} />}
              disabled={isLoading}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<Lock size={18} />}
              disabled={isLoading}
              showPasswordToggle
            />

            <div className={styles.formActions}>
              <label className={styles.rememberMe}>
                <input type="checkbox" disabled={isLoading} />
                <span>Remember me</span>
              </label>
              <Link
                to={PUBLIC_ROUTES.FORGOT_PASSWORD}
                className={styles.forgotPassword}
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" color="currentColor" /> : 'Sign In'}
            </Button>
          </form>

          {/* Mobile Demo Chips */}
          <div className={styles.mobileDemos}>
            <p className={styles.mobileDemoTitle}>Quick Fill Roles:</p>
            <div className={styles.mobileDemoChips}>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  className={styles.mobileDemoChip}
                  onClick={() => handleDemoLogin(acc.email)}
                  type="button"
                  style={{ borderColor: acc.color, color: acc.color }}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.footer}>
            <p>Subhan Care Hospital Management System</p>
            <p>&copy; {new Date().getFullYear()} Subhan Care. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
