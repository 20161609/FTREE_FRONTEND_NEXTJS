// src/components/ModalEdit.js

import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function ModalEdit({
  isOpen,
  closeModal,
  transaction,
  saveEditTransaction,
  deleteTransaction,
}) {
  const [updatedDescription, setUpdatedDescription] = useState('');
  const [updatedCashFlow, setUpdatedCashFlow] = useState(0);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);

  useEffect(() => {
    if (transaction) {
      setUpdatedDescription(transaction.description || '');
      setUpdatedCashFlow(transaction.cashFlow);
      if (transaction.receiptImage) {
        setReceiptImage(transaction.receiptImage);
      } else {
        setReceiptImage(null);
      }
    }
  }, [transaction]);

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setReceiptImage(URL.createObjectURL(file));
    }
  };

  const removeReceiptImage = () => {
    setReceiptFile(null);
    setReceiptImage(null);
  };

  const handleSave = () => {
    saveEditTransaction({
      ...transaction,
      description: updatedDescription,
      cashFlow: updatedCashFlow,
      receiptFile,
    });
  };

  const handleDelete = () => {
    deleteTransaction(transaction.tid);
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        {/* Background Overlay */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        {/* Modal Content */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:max-w-lg w-full p-6">
                {/* Close */}
                <div className="flex justify-end">
                  <button
                    className="text-gray-700 dark:text-gray-200 hover:text-gray-500"
                    onClick={closeModal}
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Moal Content */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Edit Transaction
                  </h3>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={transaction.date}
                      onChange={() => {}}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-300"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={updatedDescription}
                      onChange={(e) => setUpdatedDescription(e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1">
                      CashFlow
                    </label>
                    <input
                      type="number"
                      value={updatedCashFlow}
                      onChange={(e) =>
                        setUpdatedCashFlow(Number(e.target.value))
                      }
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1">
                      Receipt
                    </label>
                    {receiptImage ? (
                      <div className="mb-2">
                        <img
                          src={receiptImage}
                          alt="Receipt"
                          className="w-full h-auto cursor-pointer rounded-md"
                          onClick={() => window.open(receiptImage, '_blank')}
                        />
                      </div>
                    ) : (
                      <p className="text-gray-500">No Image</p>
                    )}
                    <input
                      type="file"
                      onChange={handleReceiptChange}
                      className="w-full mt-2"
                    />
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md"
                    >
                      Delete
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
                    >
                      Save
                    </button>
                    <button
                      onClick={closeModal}
                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
