// src/components/changePassword.js
import { api_get_user_info, api_signin, api_modify_password } from '@/libs/api_user';
import { useState } from 'react';

export default function ChangePassword({ userEmail, closePasswordModal }) {
  const [curPassword, setCurPassword] = useState(''); // State for Current password
  const [newPassword, setNewPassword] = useState(''); // State for new password
  const [confirmPassword, setConfirmPassword] = useState(''); // State for confirming new password
  const [errorMessage, setErrorMessage] = useState(''); // State for error messages

  // Handler for password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    // Add API call logic for password change here
    const res = await api_signin(userEmail, curPassword);
    console.log(userEmail, curPassword);
    if (res == null) {
        setErrorMessage('Incorrect current password');
        return;
    }

    if (newPassword == curPassword){
        setErrorMessage('New password cannot be the same as the current password');
        return;
    }

    const confirmChange = confirm('Are you sure you want to change your password?');
    if (!confirmChange){
        closePasswordModal(); // Close modal after password change
        return;
    }

    try{
        await api_modify_password(newPassword);
        alert('Password changed successfully');
        closePasswordModal(); // Close modal after password change
    }catch(error){
        if (error.message){
            alert(error.message);
            return;
        }else{
            alert('Error changing password');
            return
        }
    }

    return;
    try {
      console.log('Password changed successfully', newPassword);
    } catch (error) {
      setErrorMessage('Error changing password');
      console.error(error);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Current Password Input */}
      <div>
        <label className="block text-sm font-medium text-sky-500">
          Current Password
        </label>
        <input
          type="password"
          value={curPassword}
          onChange={(e) => setCurPassword(e.target.value)}
          autoComplete="new-password" // Set autocomplete to new-password
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
        />
      </div>

      {/* New Password Input */}
      <div>
        <label className="block text-sm font-medium text-sky-500">
          New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password" // Set autocomplete to new-password
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
        />
      </div>

      {/* Confirm New Password Input */}
      <div>
        <label className="block text-sm font-medium text-sky-500">
          Confirm New Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password" // Set autocomplete to new-password
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
        />
      </div>

      {/* Error Message */}
      {errorMessage && <p className="text-red-600">{errorMessage}</p>}

      {/* Change Password Button */}
      <button
        onClick={handlePasswordChange}
        className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Change Password
      </button>
    </div>
  );
}
