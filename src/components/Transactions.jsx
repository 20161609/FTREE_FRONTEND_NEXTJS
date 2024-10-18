// src/components/Transactions.js

'use client';

import React, { useState, useEffect } from 'react';
import { formatNumber } from '@/libs/santizer';
import {
  api_upload_transaction,
  api_get_receipt_image,
  api_delete_transaction,
  api_modify_transaction,
} from '@/libs/api_transaction';
import ModalAddition from '@/components/ModalAddition';
import ModalEdit from '@/components/ModalEdit';

export default function Transactions({ transactions, initTransactions, curPath }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 페이지당 트랜잭션 수

  // 페이지네이션을 위한 트랜잭션 슬라이스
  const indexOfLastTransaction = currentPage * itemsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - itemsPerPage;
  const currentTransactions = (transactions || []).slice(indexOfFirstTransaction, indexOfLastTransaction);

  const totalPages = Math.ceil((transactions || []).length / itemsPerPage);

  // 페이지네이션 범위 계산
  const pageRange = 5; // 한 번에 표시할 페이지 버튼 수
  const [pageGroup, setPageGroup] = useState(0);

  useEffect(() => {
    setPageGroup(Math.floor((currentPage - 1) / pageRange));
  }, [currentPage]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const openEditModal = async (transaction) => {
    if (transaction.receipt) {
      const receiptImage = await api_get_receipt_image(transaction.tid);
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
      await api_modify_transaction(tid, date, curPath, cashFlow, description, receiptFile);
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
      await api_upload_transaction(date, curPath, cashFlow, description, receiptFile);
      await initTransactions(curPath);
      closeNewModal();
    } catch (error) {
      console.error('Error uploading transaction:', error);
    }
  };

  // 페이지네이션 버튼 생성
  const pageNumbers = [];
  const startPage = pageGroup * pageRange + 1;
  const endPage = Math.min(startPage + pageRange - 1, totalPages);

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white notranslate">
          Transactions
        </h2>
        <button
          onClick={openNewModal}
          className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md"
        >
          New
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full mb-4">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="px-4 py-2 text-xs text-left text-gray-700 dark:text-gray-200 notranslate">
                Date
              </th>
              <th className="px-4 py-2 text-xs text-left text-gray-700 dark:text-gray-200 notranslate">
                Branch
              </th>
              <th className="px-4 py-2 text-xs text-left text-gray-700 dark:text-gray-200 notranslate">
                Cashflow
              </th>
              <th className="px-4 py-2 text-xs text-left text-gray-700 dark:text-gray-200 notranslate">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((transaction) => (
              <tr
                key={transaction.tid}
                className="border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => openEditModal(transaction)}
              >
                <td className="px-4 py-2 text-xxs text-gray-900 dark:text-gray-200 notranslate">
                  {transaction.date.substring(2, transaction.date.length)}
                </td>
                <td className="px-4 py-2 text-xxs text-gray-900 dark:text-gray-200 notranslate">
                  {transaction.branch.substring(curPath.length, transaction.branch.length) || '/'}
                </td>
                <td className="px-4 py-2 text-xs text-gray-900 dark:text-gray-200 notranslate">
                  {formatNumber(transaction.cashFlow)}
                </td>
                <td className="px-4 py-2 text-xxs text-gray-900 dark:text-gray-200 notranslate">
                  {transaction.description ? transaction.description.substring(0, 5) : '-'}
                </td>
              </tr>
            ))}
            {currentTransactions.length === 0 && (
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

      {/* 페이지네이션 컨트롤 */}
      <div className="flex justify-center mt-4">
        {/* 이전 페이지 그룹으로 이동 */}
        {startPage > 1 && (
          <button
            onClick={() => paginate(startPage - 1)}
            className="mx-1 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            &laquo;
          </button>
        )}
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`mx-1 px-3 py-1 rounded ${
              currentPage === number
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            {number}
          </button>
        ))}
        {/* 다음 페이지 그룹으로 이동 */}
        {endPage < totalPages && (
          <button
            onClick={() => paginate(endPage + 1)}
            className="mx-1 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            &raquo;
          </button>
        )}
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
