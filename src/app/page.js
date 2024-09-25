// src/app/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api_signin } from '@/libs/api_user';
import { api_get_user_info } from '@/libs/api_user';
import ModalPassword from '@/components/ModalPassword';

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    useremail: '',
    password: '',
  });

  useEffect( () => {
    const checkLogin = async () => {
      if (localStorage.getItem('idToken')) {
        localStorage.removeItem('idToken');
        try {
          const user = await api_get_user_info();
          if (user === null) {
            console.log('Invalid ID Token...');
            localStorage.removeItem('idToken');
            return;
          }
          
          alert(`You are already logged in. ${user}`);

          router.push('/main');  
        } catch(error) {
          // Delete IdToken from localStorage
          console.log('Error:', error);
          localStorage.removeItem('idToken');
        }
      }
    };

    checkLogin();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);  
  const handleLogin = async (e) => {
    e.preventDefault();
    const signinResult = await api_signin(credentials.useremail, credentials.password);
    if (signinResult === null) {
      return;
    }

    router.push('/main');
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center">
          {/* <Image src="/ftree-logo.png" alt="Finance Tree Logo" width={100} height={100} /> */}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Finance Tree
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
                className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-sm text-green-600 dark:text-green-400 hover:underline"
              onClick={openModal}
            >
              Forgot Password?
            </button>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Sign In
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <a
              href="/signup"
              className="font-medium text-green-600 dark:text-green-400 hover:underline"
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>
      {/* Rendering the modal component */}
      {isModalOpen && <ModalPassword closeModal={closeModal} />}
    </div>
  );
}
