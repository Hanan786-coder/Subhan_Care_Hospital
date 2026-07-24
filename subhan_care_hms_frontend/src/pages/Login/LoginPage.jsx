import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PUBLIC_ROUTES, PRIVATE_ROUTES } from '@/constants/routes';
import { Button, Input, Spinner } from '@/components/ui';
import { HeartPulse, Mail, Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const targetPath = location.state?.from?.pathname || PRIVATE_ROUTES.DASHBOARD;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, navigate, targetPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      await login(normalizedEmail, password, rememberMe);
      toast.success('Signed in successfully');
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <HeartPulse size={30} color="#ffffff" />
            </div>
            <h1>Subhan Care</h1>
          </div>
          <p className={styles.tagline}>
            Secure access for clinical, operational, and administrative staff in one focused workspace.
          </p>

          <div className={styles.trustBar}>
            <span>Role-based access</span>
            <span>Encrypted session handling</span>
            <span>Fast dashboard entry</span>
          </div>

          <div className={styles.securityNote}>
            <ShieldCheck size={16} />
            <span>Protected login with session validation before dashboard access.</span>
          </div>
        </div>
      </div>

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
            <p>Sign in to continue to your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email Address"
              type="email"
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<Mail size={18} />}
              disabled={isLoading}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
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
              autoComplete="current-password"
            />

            <div className={styles.formActions}>
              <label className={styles.rememberMe}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
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
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
