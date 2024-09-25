// src/components/ModalSettings.js

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { api_withdraw, api_update_userinfo, api_modify_password, api_signout } from '@/libs/api_user';

export default function ModalSettings({
  isOpen,
  closeModal,
  username,
  setUsername,
  useAI,
  setUseAI,
  userEmail
}) {
  // State for confirming account deletion
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    useEffect(() => {
    }, []);


  // Handler for changing the name
  const handleNameChange = (e) => {
    setUsername(e.target.value);
  };

  // Handler for toggling the AI feature
  const handleToggleAI = () => {
    setUseAI(!useAI);
  };

  // Handler for changing the password (placeholder)
  const handleChangePassword = async () => {
    try{
      const resultModify = await api_modify_password(userEmail);
      if(resultModify === null){
        alert("Failed to modify password");
      }

      alert("Email(for Modification pw) has been sent to your email address.");

    }catch(error){
      console.error('api_modify_password error:', error);
      alert(error.message);
    }
  };

  // Handler for initiating account deletion
  const handleDeleteAccount = () => {
    setIsConfirmingDelete(true);
  };

  const handleSave = async () => {
    try{
      const updateResult = await api_update_userinfo(username, useAI);
      if(updateResult === null){
        return;
      }

      closeModal();
    }catch(error){
      console.error('api_update_userinfo error:', error);
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    try{
      const result = await api_signout();
      if(result === false){
        return;
      }
      window.location.href = '/';
    }catch(error){
      console.error('api_signout error:', error);
      alert(error.message);
    }
  }

  // Handler for confirming account deletion
  const confirmDeleteAccount = async () => {
    // Input Confirmation Logic Here
    const code = Math.random().toString(36).substring(7);
    const input_code = prompt(`To confirm deletion, please enter '${code}'.`);
    
    // Check if the input code matches the generated code
    if(code === input_code){
        try{
            await api_withdraw();
            setIsConfirmingDelete(false);
            closeModal();
        
            // Delete the user's token
            localStorage.removeItem('idToken');
    
            // Redirect to the login page
            window.location.href = '/';    
        }catch(error){
            console.error('api_withdraw error:', error);
            alert(error.message);
            setIsConfirmingDelete(false);
            closeModal();
        }
    }else{
        alert('Not matched with the deletion code.');
    }
  };

  // Handler for canceling account deletion
  const cancelDeleteAccount = () => {
    setIsConfirmingDelete(false);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-60"
          leave="ease-in duration-200"
          leaveFrom="opacity-60"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black" />
        </Transition.Child>

        {/* Modal content */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-90"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-90"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                >
                  Settings
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  {/* Name Change */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Name
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={handleNameChange}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* AI Feature Toggle */}
                  <div className="flex items-center">
                    <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Use AI for Reading Receipts
                    </label>
                    <button
                      onClick={handleToggleAI}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        useAI ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          useAI ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Change Password */}
                  <div>
                    <button
                      onClick={handleChangePassword}
                      className="text-white-600 hover:underline"
                    >
                      Change Password
                    </button>
                  </div>
                  {/* Signout Account */}
                  <div>
                    <button
                      onClick={handleSignOut}
                      className="text-yellow-600 hover:underline"
                    >
                      Sign Out
                    </button>
                  </div>


                  {/* Delete Account */}
                  <div>
                    <button
                      onClick={handleDeleteAccount}
                      className="text-red-600 hover:underline"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>

                {/* Confirmation for Account Deletion */}
                {isConfirmingDelete && (
                  <div className="mt-4 p-4 bg-red-100 dark:bg-red-200 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-900">
                      Are you sure you want to delete your account? This action cannot be undone.
                    </p>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={cancelDeleteAccount}
                        className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDeleteAccount}
                        className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                {!isConfirmingDelete && (
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="mr-2 inline-flex justify-center rounded-md border border-transparent bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={handleSave}
                    >
                      Save
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
