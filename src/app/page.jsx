'use client';

import { useState, useEffect } from 'react';
import { api_test } from '@/libs/api_test';
import { useRouter } from 'next/navigation';
import { api_signin, api_get_user_info } from '@/libs/api_user';
import ModalForgetPassword from '@/components/ModalForgetPassword';

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    useremail: '',
    password: '',
  });
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state

  useEffect(() => {
    const checkSession = async () => {  
      const test = await api_test();
      console.log(test);
      
      const userinfo = await api_get_user_info();
      if (userinfo !== null) {
        router.replace('/main'); // Considered other os
        // router.push('/main'); // Version for Window
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Disable interactions
    const signinResult = await api_signin(credentials.useremail, credentials.password);
    setIsLoading(false); // Re-enable interactions

    if (signinResult === null) {
      return;
    }
    alert('Login Success');
    router.push('/main');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Finance Tree2
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="useremail" className="sr-only">
                ID (Email)
              </label>
              <input
                id="useremail"
                name="useremail"
                type="text"
                required
                value={credentials.useremail}
                onChange={(e) =>
                  setCredentials({ ...credentials, useremail: e.target.value })
                }
                disabled={isLoading} // Disable input when loading
                className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="ID (Email)"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                disabled={isLoading} // Disable input when loading
                className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-sm text-green-600 dark:text-green-400 hover:underline"
              disabled={isLoading} // Disable button when loading
            >
              Forgot Password?
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading} // Disable submit button when loading
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <a
              href="/signup"
              className={`font-medium text-green-600 dark:text-green-400 hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>
      <ModalForgetPassword isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}