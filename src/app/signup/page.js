// src/app/signup/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api_possible_signup, api_check_verify, api_signup, api_signin } from '@/libs/api_user';
import { api_send_verify_code } from '@/libs/api_user';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    verificationCode: '',
  });
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handler to send verification code to email
  const handleSendCode = async () => {
    setError('');
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email format.');
      return;
    }

    let possible = await api_possible_signup(formData.email);
    if (!possible.status) {
      setError(possible.message);
      return;
    }
    await api_send_verify_code(formData.email);
    
    try {
      setLoading(true);
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

  // Handler to verify the entered verification code
  const handleVerifyCode = async () => {
    setError('');
    if (formData.verificationCode.trim() === '') {
      setError('Please enter the verification code.');
      return;
    }

    try {
      setLoading(true);
      const verified = await api_check_verify(formData.email, formData.verificationCode);
      if (verified) {
        setIsVerified(true);
        setLoading(false);
      } else {
        setLoading(false);
        setError('Invalid verification code.');
      }
    } catch (err) {
      setLoading(false);
      setError('Failed to verify the code. Please try again.');
    }
  };

  // Handler for the signup process
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Additional validation (if necessary)
    if (!isVerified) {
      setError('Please complete the email verification.');
      return;
    }

    try {
      setLoading(true);
      await api_signup(formData.email, formData.password, formData.name);
      setLoading(false);
      // Redirect to login page after successful signup
      router.push('/');
      await api_signin(formData.email, formData.password);

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
            {/* Email field and verification code send button */}
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
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </button>
                )}
              </div>
              {/* Verification code input field */}
              {isCodeSent && (
                <div className="mt-4 flex items-center">
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    value={formData.verificationCode}
                    onChange={(e) =>
                      setFormData({ ...formData, verificationCode: e.target.value })
                    }
                    className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Verification Code"
                  />
                  {!isVerified && (
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Name field */}
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

            {/* Password field */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Password"
                disabled={!isVerified}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Signup button */}
          <div>
            <button
              type="submit"
              disabled={!isVerified || loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isVerified
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
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
