// src/components/BranchTree.js

'use client';

import { FaFolder, FaTrash } from 'react-icons/fa';
import { api_mkdir, api_rmdir } from '@/libs/api_branch';

export default function BranchTree({
  branch, shiftBranch, initTree, initTransactions,
}) {
  const addBranch = async () => {
    const newBranch = prompt('Input new branch name');
    if (!newBranch) return;

    await api_mkdir(branch.path, newBranch);
    await initTree();
  };

  // Delete branch
  const deleteBranch = async (branchPath) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this branch?');
    if (!confirmDelete) return;

    await api_rmdir(branchPath);
    await initTree();
    await initTransactions();
  };

  const children = branch?.children || {};

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div className="space-y-2">
        {Object.keys(children).length > 0 ? (
          Object.keys(children).map((childKey) => {
            const childBranch = children[childKey];
            return (
              <div key={childBranch.bid} className="flex items-center">
                <button
                  className="flex items-center text-left text-gray-700 dark:text-gray-200 hover:underline notranslate"
                  onClick={() => shiftBranch(childBranch.path)}
                >
                  <FaFolder className="mr-2" />
                  {childKey}
                </button>
                <button
                  className="text-red-500 ml-2 notranslate"
                  onClick={() => deleteBranch(childBranch.path)}
                >
                  <FaTrash />
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No child branches.</p>
        )}
      </div>
      <div className="mt-6">
        <button
          onClick={addBranch}
          className="mt-2 w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md"
        >
          New Branch
        </button>
      </div>
    </div>
  );
}
