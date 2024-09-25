// src/components/Transactions.js

'use client';

import React, { useState } from 'react';
import {formatNumber} from '@/libs/santizer';
import {
  upload_transaction,
  api_get_receipt_image,
  api_delete_transaction,
  api_modify_transaction,
} from '@/libs/api_transaction';
import ModalAddition from '@/components/ModalAddition';
import ModalEdit from '@/components/ModalEdit';

export default function Transactions({
  transactions,
  initTransactions,
  curPath,
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const openEditModal = async (transaction) => {
    if (transaction.receipt) {
      const receiptImage = await api_get_receipt_image(transaction.receipt);
      transaction.receiptImage = receiptImage;
    }
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const openNewModal = () => {
    setIsNewModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTransaction(null);
  };

  const closeNewModal = () => {
    setIsNewModalOpen(false);
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const saveEditTransaction = async (updatedTransaction) => {
    const { tid, date, cashFlow, description, receiptFile } = updatedTransaction;
    try {
      await api_modify_transaction(
        tid,
        date,
        curPath,
        cashFlow,
        description,
        receiptFile
      );
      await initTransactions(curPath);
      closeEditModal();
    } catch (error) {
      console.error('Error modifying transaction:', error);
    }
  };

  const deleteTransaction = async (tid) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api_delete_transaction(tid);
        await initTransactions(curPath);
        closeEditModal();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const saveNewTransaction = async (newTransaction) => {
    const { date, cashFlow, description, receiptFile } = newTransaction;
    try {
      await upload_transaction(
        date,
        curPath,
        cashFlow,
        description,
        receiptFile
      );
      await initTransactions(curPath);
      closeNewModal();
    } catch (error) {
      console.error('Error uploading transaction:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Transactions
        </h2>
        <button
          onClick={openNewModal}
          // className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
          className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md"
        >
          New
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full mb-4">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="px-4 py-2 text-xs text-left text-gray-700 dark:text-gray-200">
                Date
              </th>
              <th className="px-4 py-2 text-xs text-left text-gray-700 dark:text-gray-200">
                In+
              </th>
              <th className="px-4 py-2 text-xs text-left text-gray-700 dark:text-gray-200">
                Out-
              </th>
              <th className="px-4 py-2 text-xs text-left text-gray-700 dark:text-gray-200">
                Bal·
              </th>
              <th className="px-4 py-2 text-xs text-left text-gray-700 dark:text-gray-200">
                Branch
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.tid}
                className="border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => openEditModal(transaction)}
              >
                <td className="px-4 py-2 text-xs text-gray-900 dark:text-gray-200">
                  {transaction.date}
                </td>
                <td className="px-4 py-2 text-xs text-gray-900 dark:text-gray-200">
                  {transaction.cashFlow > 0 ? formatNumber(transaction.cashFlow) : ''}
                </td>
                <td className="px-4 py-2 text-xs text-gray-900 dark:text-gray-200">
                  {transaction.cashFlow < 0 ? formatNumber(-transaction.cashFlow) : ''}
                </td>
                <td className="px-4 py-2 text-xs text-gray-900 dark:text-gray-200">
                  {formatNumber(transaction.balance)}
                </td>
                <td className="px-4 py-2 text-xxs text-gray-900 dark:text-gray-200">
                  {transaction.branch}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-2 text-center text-gray-500 dark:text-gray-400"
                >
                  No transactions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Transaction Modal */}
      {isEditModalOpen && selectedTransaction && (
        <ModalEdit
          isOpen={isEditModalOpen}
          closeModal={closeEditModal}
          transaction={selectedTransaction}
          saveEditTransaction={saveEditTransaction}
          deleteTransaction={deleteTransaction}
        />
      )}

      {/* New Transaction Modal */}
      {isNewModalOpen && (
        <ModalAddition
          isOpen={isNewModalOpen}
          closeModal={closeNewModal}
          saveNewTransaction={saveNewTransaction}
          initialDate={getTodayDate()}
        />
      )}
    </div>
  );
}
