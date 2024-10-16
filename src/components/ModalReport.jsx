// src/components/ModalReport.js 

import React, { useEffect, useState } from 'react';
import { formatNumber } from '@/libs/santizer';
import { Dialog, Transition } from '@headlessui/react';
import { download_daily_xlsx } from '@/libs/report';
import { download_monthly_xlsx } from '@/libs/report';
import { download_receipt_pdf } from '@/libs/report';
import { download_tree_xlsx } from '@/libs/report';
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip,
} from 'recharts';

export default function ModalReport({ isOpen, closeModal, transactions, branch }) {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenditure, setTotalExpenditure] = useState(0);
  const [childrenReport, setChildrenReport] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Loading state added

  // 날짜 범위를 위한 상태값
  const [beginDate, setBeginDate] = useState(new Date('0001-01-01'));
  const [endDate, setEndDate] = useState(new Date('9999-12-31'));

  useEffect(() => {
    if (isOpen) {
      console.log('Begin ModalReport');
      console.log(transactions);

      // Calculate the minimum start date and maximum end date with temporary variables
      let tempBeginDate = new Date('0001-01-01');
      let tempEndDate = new Date('9999-12-31');

      for (const transaction of transactions) {
        const transactionDate = new Date(transaction.date);

        // Set Begin Date
        if (tempBeginDate.getTime() === new Date('0001-01-01').getTime()) {
          tempBeginDate = transactionDate;
        } else if (transactionDate.getTime() < tempBeginDate.getTime()) {
          tempBeginDate = transactionDate;
        }

        // Set End Date
        if (tempEndDate.getTime() === new Date('9999-12-31').getTime()) {
          tempEndDate = transactionDate;
        } else if (transactionDate.getTime() > tempEndDate.getTime()) {
          tempEndDate = transactionDate;
        }
      }

      // Update the state at once
      setBeginDate(tempBeginDate);
      setEndDate(tempEndDate);

      console.log('End ModalReport');
    }
  }, [isOpen, transactions]);

  useEffect(() => {
    initTotalValue();
  }, [transactions, beginDate, endDate]);

  const initTotalValue = () => {
    let income = 0;
    let expenditure = 0;
    const report = {};

    // Filter transactions by transaction.date
    const filteredTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= beginDate && transactionDate <= endDate;
    });

    const monthlyTotals = {};

    filteredTransactions.forEach((transaction) => {
      let childPath = '';
      if (transaction.branch === branch.path) {
        childPath = 'Extra';
      } else {
        const relativePath = transaction.branch.split(`${branch.path}/`)[1];
        childPath = relativePath ? relativePath.split('/')[0] : 'Unknown';
      }

      if (!report[childPath]) {
        report[childPath] = {
          income: 0,
          expenditure: 0,
        };
      }

      if (transaction.cashFlow > 0) {
        income += transaction.cashFlow;
        report[childPath].income += transaction.cashFlow;
      } else {
        expenditure += -transaction.cashFlow;
        report[childPath].expenditure += -transaction.cashFlow;
      }

      // Calculate monthly income and expenditure
      const transactionDate = new Date(transaction.date);
      const yearMonth =
        transactionDate.getFullYear() +
        '-' +
        (transactionDate.getMonth() + 1).toString().padStart(2, '0');

      if (!monthlyTotals[yearMonth]) {
        monthlyTotals[yearMonth] = {
          income: 0,
          outcome: 0,
          balance: 0,
        };
      }

      if (transaction.cashFlow > 0) {
        monthlyTotals[yearMonth].income += transaction.cashFlow;
      } else {
        monthlyTotals[yearMonth].outcome += -transaction.cashFlow;
      }
    });

    // Calculate monthly balance
    for (const month in monthlyTotals) {
      monthlyTotals[month].balance =
        monthlyTotals[month].income - monthlyTotals[month].outcome;
    }

    // Create a list of months from the last date to 12 months ago
    const months = [];
    const currentDate = new Date(endDate);
    currentDate.setDate(1); // Set the date to the first day of the month
    for (let i = 0; i < 12; i++) {
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const yearMonth = `${year}-${month}`;
      months.unshift(yearMonth); // Add to the beginning of the array
      currentDate.setMonth(currentDate.getMonth() - 1);
    }

    // Convert monthly data to an array and sort it
    const monthlyDataArray = months.map((month) => ({
      month: month,
      income: monthlyTotals[month]?.income || 0,
      outcome: monthlyTotals[month]?.outcome || 0,
      balance: monthlyTotals[month]?.balance || 0,
    }));

    setTotalIncome(income);
    setTotalExpenditure(expenditure);
    setChildrenReport(report);
    setMonthlyData(monthlyDataArray);
  };

  // Prepare data for pie chart
  const incomeData = Object.entries(childrenReport)
    .filter(([child, data]) => data.income > 0)
    .map(([child, data]) => ({
      name: child,
      value: data.income,
    }));

  const expenditureData = Object.entries(childrenReport)
    .filter(([child, data]) => data.expenditure > 0)
    .map(([child, data]) => ({
      name: child,
      value: data.expenditure,
    }));

  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#AF19FF',
    '#FF4560',
    '#775DD0',
    '#FF66C3',
  ];

  const handleDownload = async (type) => {
    console.log('type', type);
    setIsLoading(true); // Start loading
    try {
      if (type === 'daily') {
        await download_daily_xlsx(transactions, beginDate, endDate);
      } else if (type === 'monthly') {
        await download_monthly_xlsx(transactions, beginDate, endDate, 1);
      } else if (type === 'receipt') {
        await download_receipt_pdf(transactions, beginDate, endDate, 1);
      } else if (type === 'tree') {
        await download_tree_xlsx(transactions, beginDate, endDate, 1, branch, 10);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false); // End loading
    }
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
              <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:max-w-2xl w-full p-6">
                {/* Loading Indicator */}
                {isLoading && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Close Button */}
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

                {/* 날짜 범위 설정 */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Date Range
                    </h2>
                    <div className="flex gap-4">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-200">
                          Begin Date
                        </label>
                        <input
                          type="date"
                          value={beginDate.toISOString().split('T')[0]}
                          onChange={(e) => {
                            const newDate = new Date(e.target.value);
                            if (!isNaN(newDate)) {
                              setBeginDate(newDate);
                            } else {
                              console.error('Invalid date format.');
                            }
                          }}
                          className="block w-full mt-1 border-black-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 dark:text-gray-200">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate.toISOString().split('T')[0]}
                          onChange={(e) => {
                            const newDate = new Date(e.target.value);
                            if (!isNaN(newDate)) {
                              setEndDate(newDate);
                            } else {
                              console.error('Invalid date format.');
                            }
                          }}
                          className="block w-full mt-1 border-black-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Report Summary */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Report Summary
                    </h2>
                    <div className="space-y-2 text-gray-700 dark:text-gray-200">
                      <p>
                        Total Income: <span>{formatNumber(totalIncome)}</span>
                      </p>
                      <p>
                        Total Expenditure:{' '}
                        <span>{formatNumber(totalExpenditure)}</span>
                      </p>
                      <p>
                        Total Balance:{' '}
                        <span>{formatNumber(totalIncome - totalExpenditure)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Download Report - xlsx
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      <button
                        disabled={isLoading}
                        className={`px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none notranslate ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => handleDownload('daily')}
                      >
                        Daily
                      </button>
                      <button
                        disabled={isLoading}
                        className={`px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none notranslate ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => handleDownload('monthly')}
                      >
                        Monthly
                      </button>
                      <button
                        disabled={isLoading}
                        className={`px-4 py-2 bg-[#8B4513] text-white font-semibold rounded-lg hover:bg-[#A0522D] focus:outline-none notranslate ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => handleDownload('tree')}
                      >
                        Tree
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Download Report - pdf
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      <button
                        disabled={isLoading}
                        className={`px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 focus:outline-none ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => handleDownload('receipt')}
                      >
                        Receipt
                      </button>
                    </div>
                  </div>

                  {/* Data Table */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Data Table
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full mt-4">
                        <thead>
                          <tr className="bg-gray-200 dark:bg-gray-700">
                            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 notranslate">
                              Child
                            </th>
                            <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-200 notranslate">
                              Income
                            </th>
                            <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-200 notranslate">
                              Outcome
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(childrenReport).map(
                            ([child, data], index) => (
                              <tr
                                key={index}
                                className="border-b border-gray-200 dark:border-gray-700 notranslate ">
                                <td className="px-4 py-2 text-ts text-left text-gray-900 dark:text-gray-200 notranslate ">
                                  {child}
                                </td>
                                <td className="px-4 py-2 text-xs text-right text-gray-900 dark:text-gray-200 notranslate ">
                                  {formatNumber(data.income)}
                                </td>
                                <td className="px-4 py-2 text-xs text-right text-gray-900 dark:text-gray-200 notranslate ">
                                  {formatNumber(data.expenditure)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Income Pie Chart */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white notranslate">
                      Income Distribution
                    </h3>
                    {incomeData.length > 0 ? (
                      <div className="flex justify-center notranslate">
                        <PieChart width={400} height={300}>
                          <Pie
                            data={incomeData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {incomeData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400">
                        No income data available.
                      </p>
                    )}
                  </div>

                  {/* Expenditure Pie Chart */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white notranslate">
                      Expenditure Distribution
                    </h3>
                    {expenditureData.length > 0 ? (
                      <div className="flex justify-center notranslate">
                        <PieChart width={400} height={300}>
                          <Pie
                            data={expenditureData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {expenditureData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400">
                        No expenditure data available.
                      </p>
                    )}
                  </div>

                  {/* Bar Graphs */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Bar Graphs
                    </h3>
                    {/* Monthly Income Bar Chart */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mt-4 notranslate ">
                        Monthly Income
                      </h4>
                      {monthlyData.length > 0 ? (
                        <div className="flex justify-center notranslate">
                          <BarChart
                            width={600}
                            height={300}
                            data={monthlyData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="income" fill="#8884d8" />
                          </BarChart>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400">
                          No data available.
                        </p>
                      )}
                    </div>

                    {/* Monthly Outcome Bar Chart */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mt-4 notranslate">
                        Monthly Outcome
                      </h4>
                      {monthlyData.length > 0 ? (
                        <div className="flex justify-center notranslate">
                          <BarChart
                            width={600}
                            height={300}
                            data={monthlyData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="outcome" fill="#82ca9d" />
                          </BarChart>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400">
                          No data available.
                        </p>
                      )}
                    </div>

                    {/* Monthly Balance Bar Chart */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mt-4 notranslate">
                        Monthly Balance
                      </h4>
                      {monthlyData.length > 0 ? (
                        <div className="flex justify-center notranslate">
                          <BarChart
                            width={600}
                            height={300}
                            data={monthlyData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="balance" fill="#ffc658" />
                          </BarChart>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400">
                          No data available.
                        </p>
                      )}
                    </div>
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
