// src/app/main/page.jsx
'use client';

import { useState, useEffect } from 'react';
import BranchTree from '@/components/BranchTree';
import Transactions from '@/components/Transactions';
import ModalReport from '@/components/ModalReport';
import ModalSettings from '@/components/ModalSettings';
import { api_get_tree } from '@/libs/api_branch';
import { api_get_user_info } from '@/libs/api_user';
import { api_refer_daily } from '@/libs/api_transaction';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner'; // Import the LoadingSpinner component

export default function MainPage() {
  // State variables
  const [transactions, setTransactions] = useState([]);
  const [tree, setTree] = useState(null);
  const [branch, setBranch] = useState(null);
  const [curPath, setCurPath] = useState('Home');

  // Modal state variables
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // User information state variables
  const [useAI, setUseAI] = useState(true);
  const [username, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Functions to open/close modals
  const openReport = () => setIsReportOpen(true);
  const closeReport = () => setIsReportOpen(false);

  const getBackToLogin = async () => {
    window.location.href = '/';
  };

  const openSettings = async () => {
    try {
      const userinfo = await api_get_user_info();
      setUseAI(userinfo.useai);
      setUsername(userinfo.username);
      setUserEmail(userinfo.email);
      setIsSettingsOpen(true);
    } catch (error) {
      console.error('api_get_user_info error:', error);
      return;
    }
  };

  const closeSettings = () => setIsSettingsOpen(false);

  // Initialize the tree data
  async function initTree() {
    const data = await api_get_tree();
    console.log('data', 'begin');
    console.log(data);
    console.log('data', 'end');

    setTree(data);

    let curBranch = data['Home'];
    const pathParts = curPath.split('/').slice(1);
    curBranch = pathParts.reduce((branch, part) => branch.children[part], curBranch);
    setBranch(curBranch);
  }

  // Initialize transaction data based on the current branch path
  async function initTransactions(curBranchPath = 'Home') {
    try {
      const data = await api_refer_daily(curBranchPath);
      setTransactions(data);
    } catch (error) {
      console.error('api_refer_daily error:', error);
      alert(error.message);
    }
  }

  useEffect(() => {
    // Check Login status
    const checkLogin = async () => {
      const user = await api_get_user_info();
      if (user === null) {
        window.location.href = '/';
        return false;
      }
      try {
        setUsername(user.username);
        setUserEmail(user.email);
      } catch (error) {
        console.error('api_get_user_info error:', error);
        window.location.href = '/';
        return false;
      }

      initTree();
      initTransactions();
      return true;
    };

    checkLogin();
  }, []);

  // Get branch path based on the branch's path string
  const getBranchPath = (branchPath) => {
    let pathList = branchPath.split('/');
    let node = tree['Home'];
    const branchList = [node];

    for (let i = 1; i < pathList.length; i++) {
      node = node.children[pathList[i]];
      branchList.push(node);
    }

    return branchList;
  };

  // Shift to another branch when clicked
  const shiftBranch = async (branchPath) => {
    if (branchPath === curPath) return;

    let pathList = branchPath.split('/');
    let node = tree['Home'];
    for (let i = 1; i < pathList.length; i++) {
      node = node.children[pathList[i]];
    }
    setBranch(node);
    setCurPath(branchPath);
    await initTransactions(branchPath);
    return node;
  };

  // If the tree or branch data is not loaded yet, show the loading spinner
  if (!tree || !branch) {
    return <LoadingSpinner />; // Show LoadingSpinner component while loading
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo or Title */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Finance Tree</h1>
          {/* Button Group */}
          <div className="flex space-x-4">
            {/* Report Button */}
            <button
              className="text-gray-700 dark:text-gray-200 hover:text-blue-500"
              onClick={openReport}
            >
              Report
            </button>
            {/* Settings Button */}
            <button
              className="text-gray-700 dark:text-gray-200 hover:text-blue-500"
              onClick={openSettings}
            >
              <Cog6ToothIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {/* Branch Path Navigation */}
          <nav className="text-gray-700 dark:text-gray-200 text-sm">
            {getBranchPath(branch.path).map((branch, index, array) => (
              <span key={branch.bid}>
                <button className="hover:underline" onClick={() => shiftBranch(branch.path)}>
                  {branch.path.split('/')[branch.path.split('/').length - 1]}
                </button>
                {index < array.length - 1 && ' / '}
              </span>
            ))}
          </nav>

          {/* Branch List and Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Child Branch List */}
            <div className="col-span-1">
              <BranchTree
                branch={branch}
                shiftBranch={shiftBranch}
                initTree={initTree}
                initTransactions={initTransactions}
              />
            </div>
            {/* Transactions */}
            <div className="col-span-1 lg:col-span-2">
              <Transactions
                transactions={transactions}
                curPath={curPath}
                initTransactions={initTransactions}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      <ModalReport
        isOpen={isReportOpen}
        closeModal={closeReport}
        transactions={transactions}
        branch={branch}
      />

      {/* Settings Modal */}
      <ModalSettings
        isOpen={isSettingsOpen}
        closeModal={closeSettings}
        useAI={useAI}
        setUseAI={setUseAI}
        username={username}
        setUsername={setUsername}
        userEmail={userEmail}
      />
    </div>
  );
}
