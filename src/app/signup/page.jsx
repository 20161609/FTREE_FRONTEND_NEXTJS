// src/app/signup/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api_check_verify, api_signup, api_signin } from '@/libs/api_user';
import { api_send_verify_code } from '@/libs/api_user';

export default function SignupPage() {
  const router = useRouter();

  // Manage formData state excluding the password
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    permissionCode: '',
  });

  // Manage password state separately (to avoid storing in localStorage)
  const [password, setPassword] = useState('');

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Restore state from localStorage when the component is mounted
  useEffect(() => {
    const savedFormData = localStorage.getItem('signupFormData');
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }

    const codeSent = localStorage.getItem('signupIsCodeSent');
    if (codeSent) {
      setIsCodeSent(JSON.parse(codeSent));
    }

    const verified = localStorage.getItem('signupIsVerified');
    if (verified) {
      setIsVerified(JSON.parse(verified));
    }
  }, []);

  // Save formData to localStorage whenever it changes (excluding password)
  useEffect(() => {
    localStorage.setItem('signupFormData', JSON.stringify(formData));
  }, [formData]);

  // Save isCodeSent to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('signupIsCodeSent', JSON.stringify(isCodeSent));
  }, [isCodeSent]);

  // Save isVerified to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('signupIsVerified', JSON.stringify(isVerified));
  }, [isVerified]);

  // Remove state from localStorage when the component is unmounted (only on successful signup)
  useEffect(() => {
    return () => {
      if (isVerified) {
        localStorage.removeItem('signupFormData');
        localStorage.removeItem('signupIsCodeSent');
        localStorage.removeItem('signupIsVerified');
      }
    };
  }, [isVerified]);

  // Password validation function
  function validatePassword(password) {
    const errors = [];

    // Priority 1: Minimum 8 characters
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
      return errors; // Return immediately if the condition is not met
    }

    // Priority 2: At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter.');
      return errors; // Return immediately if the condition is not met
    }

    // Priority 3: Use only allowed special characters or alphanumeric characters
    const validSymbols = '!@#$%^&*-+';
    for (let i = 0; i < password.length; i++) {
      const char = password[i];
      if (!/[a-zA-Z0-9]/.test(char) && !validSymbols.includes(char)) {
        errors.push('Password can only contain the following special characters: !@#$%^&*-+');
        return errors; // Return immediately if the condition is not met
      }
    }

    // Priority 4: At least one number
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number.');
      return errors; // Return immediately if the condition is not met
    }

    return errors;
  }

  // Permission code send handler
  const handleSendCode = async () => {
    setError('');
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email format.');
      return;
    }

    try {
      setLoading(true);
      const res = await api_send_verify_code(formData.email);
      console.log(res);
      // Error handling
      if (res == 409) {
        setError('This email already exists.');
        setLoading(false);
        return;
      } else if (res == 404) {
        setError('Failed to send verification code. Please try again.');
        setLoading(false);
        return;
      } else if (res == 500) {
        setError('Server error occurred.');
        setLoading(false);
        return;
      } else if (res != 200) {
        setError('An unknown error occurred.');
        setLoading(false);
        return;
      }

      setIsCodeSent(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.status === 409) {
        setError('This email already exists.');
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    }
  };

  // Permission code check handler
  const handleVerify = async () => {
    setError('');
    if (formData.permissionCode.trim() === '') {
      setError('Please enter the Permission code.');
      return;
    }

    try {
      setLoading(true);
      const verified = await api_check_verify(formData.email, formData.permissionCode);
      if (verified) {
        setIsVerified(true);
        setLoading(false);
      } else {
        setLoading(false);
        setError('Invalid Permission code.');
      }
    } catch (err) {
      setLoading(false);
      setError('Permission failed. Please try again.');
    }
  };

  // Signup handler
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Check if email Permission is complete
    if (!isVerified) {
      setError('Please complete email verification.');
      return;
    }

    // Check for password errors
    if (passwordErrors.length > 0) {
      setError('Please ensure all password conditions are met.');
      return;
    }

    try {
      setLoading(true);
      await api_signup(formData.email, password, formData.name);
      // Remove state from localStorage on successful signup
      localStorage.removeItem('signupFormData');
      localStorage.removeItem('signupIsCodeSent');
      localStorage.removeItem('signupIsVerified');
      setLoading(false);
      // Login and redirect
      await api_signin(formData.email, password);
      router.push('/');
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Signup failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign Up
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Email input and send verification code button */}
            <div className="flex flex-col">
              <div className="flex items-center">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Email"
                  disabled={isCodeSent}
                />
                {!isCodeSent && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="ml-2 px-2 py-2 bg-green-600 text-ts text-white rounded-md hover:bg-green-700 focus:outline-none"
                    disabled={loading}>
                    <span className="notranslate">{loading ? 'Sending...' : 'Send'}</span>
                  </button>
                )}
              </div>
              {/* Permission code input field */}
              {isCodeSent && (
                <div className="mt-4 flex items-center">
                  <input
                    id="Permission Code"
                    name="Permission Code"
                    type="text"
                    required
                    value={formData.permissionCode}
                    onChange={(e) =>
                      setFormData({ ...formData, permissionCode: e.target.value })
                    }
                    className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Permission Code"
                  />
                  {!isVerified && (
                    <button
                      type="button"
                      onClick={handleVerify}
                      className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
                      disabled={loading}>
                    <span className="notranslate">{loading ? 'Verifying...' : 'Verify'}</span>
                  </button>
                  )}
                </div>
              )}
            </div>

            {/* Name input field */}
            <div>
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Name"
                disabled={!isVerified}
              />
            </div>

            {/* Password input field */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  const pwd = e.target.value;
                  setPassword(pwd);
                  const errors = validatePassword(pwd);
                  setPasswordErrors(errors);
                }}
                className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Password"
                disabled={!isVerified}
              />
              {/* Display password validation results */}
              {passwordErrors.length > 0 ? (
                <ul className="text-red-500 text-sm mt-1">
                  {passwordErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              ) : password && (
                <p className="text-green-500 text-sm mt-1">All password conditions are met.</p>
              )}
            </div>
          </div>

          {/* Error message display */}
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Signup button */}
          <div>
            <button
              type="submit"
              disabled={!isVerified || passwordErrors.length > 0 || loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isVerified && passwordErrors.length === 0
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <a
              href="/"
              className="font-medium text-green-600 dark:text-green-400 hover:underline"
            >
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
