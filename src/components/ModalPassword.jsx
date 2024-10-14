// src/components/ModalPassword.js

import React, { useState } from 'react';
import { api_modify_password } from '@/libs/api_user';

export default function ModalPassword({ closeModal }) {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
        const result = await api_modify_password(email);
        if(result === null){
            alert("Failed to modify password");
            return;
        }
    } catch (error) {
        alert(`Error: ${error}`);
        return;
    }
    alert(`Password reset link has been sent to ${email}`);
    closeModal();
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Background Overlay */}
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={closeModal}
        ></div>

        {/* Modal Content */}
        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-md w-full z-50">
          <div className="px-6 py-8">
            <h3 className="text-xl leading-6 font-medium text-gray-900 text-center">
              Reset Password
            </h3>
            <form onSubmit={handleSubmit} className="mt-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your email"
                />
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="mr-3 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Submit
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
