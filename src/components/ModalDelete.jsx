// src/components/ModalDelete.js

import React, { useState } from 'react';

export default function ModalDelete({ isOpen, closeModal, confirmDelete, branchName }) {
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    if (inputValue === branchName) {
      confirmDelete();
      setInputValue('');
    } else {
      alert('The input does not match the branch name.');
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Are you sure you want to delete this branch?
          </h2>
          <p className="text-gray-700 dark:text-gray-200 mb-4">
            To confirm deletion, please type <strong>{branchName}</strong>.
          </p>
          <input
            type="text"
            className="w-full px-3 py-2 mb-4 border rounded dark:text-black"
            placeholder={branchName}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={closeModal}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  );
}
