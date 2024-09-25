// src/components/ModalReport.js

import React, { useEffect, useState } from 'react';
import { formatNumber } from '@/libs/santizer';
import { Dialog, Transition } from '@headlessui/react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function ModalReport({ isOpen, closeModal, transactions, branch }) {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenditure, setTotalExpenditure] = useState(0);
  const [childrenReport, setChildrenReport] = useState({});

  useEffect(() => {
    if (isOpen) {
      console.log('Begin ModalReport');
      console.log(transactions);
      console.log('End ModalReport');
    }
  }, [isOpen, transactions]);

  useEffect(() => {
    initTotalValue();
  }, [transactions]);

  const initTotalValue = () => {
    let income = 0;
    let expenditure = 0;
    const report = {};

    transactions.forEach((transaction) => {
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
    });

    setTotalIncome(income);
    setTotalExpenditure(expenditure);
    setChildrenReport(report);
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0', '#FF66C3'];

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

                {/* Report Summary */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Report Summary
                    </h2>
                    <div className="space-y-2 text-gray-700 dark:text-gray-200">
                      <p>
                        Total Income: <span>{formatNumber(totalIncome)}</span>
                      </p>
                      <p>
                        Total Expenditure: <span>{formatNumber(totalExpenditure)}</span>
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
                      Download Report Files
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      <button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none">
                        Daily
                      </button>
                      <button className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none">
                        Monthly
                      </button>
                      <button className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 focus:outline-none">
                        Totally
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
                            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-200">
                              Child
                            </th>
                            <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">
                              Income
                            </th>
                            <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">
                              Outcome
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(childrenReport).map(([child, data], index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-200 dark:border-gray-700"
                            >
                              <td className="px-4 py-2 text-ts text-left text-gray-900 dark:text-gray-200">
                                {child}
                              </td>
                              <td className="px-4 py-2 text-xs text-right text-gray-900 dark:text-gray-200">
                                {formatNumber(data.income)}
                              </td>
                              <td className="px-4 py-2 text-xs text-right text-gray-900 dark:text-gray-200">
                                {formatNumber(data.expenditure)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Income Pie Chart */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Income Distribution
                    </h3>
                    {incomeData.length > 0 ? (
                      <div className="flex justify-center">
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
                          <Legend />
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Expenditure Distribution
                    </h3>
                    {expenditureData.length > 0 ? (
                      <div className="flex justify-center">
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
                          <Legend />
                        </PieChart>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400">
                        No expenditure data available.
                      </p>
                    )}
                  </div>

                  {/* Bar Graph Placeholder */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Bar Graph
                    </h3>
                    <div className="border border-gray-300 dark:border-gray-700 rounded p-4 text-center text-gray-500 dark:text-gray-400">
                      Bar graph will be here
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
