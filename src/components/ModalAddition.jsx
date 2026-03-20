// src/components/ModalAddition.js

import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { api_test_receipt } from '@/libs/api_test';

export default function ModalAddition({
  isOpen,
  closeModal,
  saveNewTransaction,
  initialDate,
}) {
  const [date, setDate] = useState(initialDate);
  const [description, setDescription] = useState('');
  const [income, setIncome] = useState('');
  const [outcome, setOutcome] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDate(initialDate);
      setDescription('');
      setIncome('');
      setOutcome('');
      setReceiptFile(null);
      setReceiptImage(null);
      setIsAnalyzingReceipt(false);
    }
  }, [isOpen, initialDate]);

  const applyReceiptResult = (result) => {
    if (!result) return;

    if (result.description) {
      setDescription(result.description);
    }

    const cashflow = -result.cashflow;

    if (typeof cashflow === 'number' && !Number.isNaN(cashflow)) {
      if (cashflow > 0) {
        setIncome(String(cashflow));
        setOutcome('');
      } else if (cashflow < 0) {
        setOutcome(String(Math.abs(cashflow)));
        setIncome('');
      }
    }
  };

  const handleReceiptChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);
    setReceiptImage(URL.createObjectURL(file));

    setIsAnalyzingReceipt(true);
    try {
      const result = await api_test_receipt(file);
      console.log(result);
      applyReceiptResult(result);
    } catch (error) {
      console.error('Receipt analyze failed:', error);
    } finally {
      setIsAnalyzingReceipt(false);
    }
  };

  const removeReceiptImage = () => {
    setReceiptFile(null);
    setReceiptImage(null);
    setIsAnalyzingReceipt(false);
  };

  const handleIncomeChange = (e) => {
    setIncome(e.target.value);
    if (e.target.value !== '') {
      setOutcome('');
    }
  };

  const handleOutcomeChange = (e) => {
    setOutcome(e.target.value);
    if (e.target.value !== '') {
      setIncome('');
    }
  };

  const handleSave = async () => {
    if ((income && outcome) || (!income && !outcome)) {
      alert('Please enter either Income or Outcome, but not both.');
      return;
    }

    let parsedCashFlow = 0;

    if (income) {
      parsedCashFlow = parseFloat(income);
      if (isNaN(parsedCashFlow)) {
        alert('Please enter a valid number for Income.');
        return;
      }
    } else if (outcome) {
      parsedCashFlow = -parseFloat(outcome);
      if (isNaN(parsedCashFlow)) {
        alert('Please enter a valid number for Outcome.');
        return;
      }
    }

    setIsLoading(true);
    try {
      await saveNewTransaction({
        date,
        cashFlow: parsedCashFlow,
        description,
        receiptFile,
      });
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isBusy = isLoading || isAnalyzingReceipt;

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
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
                {isBusy && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                      <p className="text-white text-sm">
                        {isAnalyzingReceipt ? 'Analyzing receipt...' : 'Saving...'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    className="text-gray-700 dark:text-gray-200 hover:text-gray-500"
                    onClick={closeModal}
                    disabled={isBusy}
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

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    New Transaction
                  </h3>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 notranslate">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-300"
                      disabled={isBusy}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 notranslate">
                      Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-300"
                      disabled={isBusy}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 notranslate">
                      Income
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={income}
                      onChange={handleIncomeChange}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-300"
                      disabled={isBusy || outcome !== ''}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 notranslate">
                      Outcome
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={outcome}
                      onChange={handleOutcomeChange}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-300"
                      disabled={isBusy || income !== ''}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-1 notranslate">
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
                        <div className="flex justify-center mt-2">
                          <button
                            onClick={removeReceiptImage}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2.5 rounded-full"
                            disabled={isBusy}
                          >
                            X
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No Image</p>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptChange}
                      className="w-full mt-2"
                      disabled={isBusy}
                    />

                    {isAnalyzingReceipt && (
                      <p className="text-sm text-blue-500 mt-2">
                        Analyzing receipt and filling fields...
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={handleSave}
                      disabled={isBusy}
                      className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md notranslate ${
                        isBusy ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Save
                    </button>
                    <button
                      onClick={closeModal}
                      disabled={isBusy}
                      className={`bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md notranslate ${
                        isBusy ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
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