// src/components/ModalForgetPassword.js

import { useState } from 'react';
import { api_forget_password } from '@/libs/api_user';

export default function ModalForgetPassword({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state

  const handleSendEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email format.');
      return;
    }

    setLoading(true); // Start loading
    setMessage(''); // Clear previous messages
    try {
      const result = await api_forget_password(email);
      if (result) {
        console.log(result);
        alert('Password reset email sent successfully!');
        onClose();
      } else {
        setMessage('Failed to send email. Please try again.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false); // End loading
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-lg font-bold mb-4 text-black">Forgot Password</h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-gray-500"
          disabled={loading} // Disable input when loading
        />
        {message && (
          <p className="text-center mb-4 text-sm text-red-500">{message}</p>
        )}
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleSendEmail}
            className={`px-4 py-2 text-white rounded ${
              loading
                ? 'bg-green-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={loading} // Disable button when loading
          >
            {loading ? 'Sending...' : 'Send Email'}
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-white rounded ${
              loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gray-400 hover:bg-gray-500'
            }`}
            disabled={loading} // Disable button when loading
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
