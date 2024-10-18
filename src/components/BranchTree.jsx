// src/components/BranchTree.js

'use client';

import { FaFolder, FaTrash } from 'react-icons/fa';
import { api_mkdir, api_rmdir } from '@/libs/api_branch';
import { useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import ModalDelete from '@/components/ModalDelete'; // 모달 컴포넌트 임포트
import './branch-style.css';

export default function BranchTree({
  branch, shiftBranch, initTree, initTransactions,
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  const addBranch = async () => {
    const newBranch = prompt('새 브랜치 이름을 입력하세요.');
    if (!newBranch) return;

    await api_mkdir(branch.path, newBranch);
    await initTree();
  };

  // 브랜치 삭제 확인 모달 열기
  const openDeleteModal = (branchPath, branchName) => {
    setBranchToDelete({ path: branchPath, name: branchName });
    setIsDeleteModalOpen(true);
  };

  // 브랜치 삭제 실행
  const confirmDelete = async () => {
    const { path } = branchToDelete;
    await api_rmdir(path);
    await initTree();
    await initTransactions();
    setIsDeleteModalOpen(false);
    setBranchToDelete(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBranchToDelete(null);
  };

  const children = branch?.children || {};

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div className="space-y-2">
        {Object.keys(children).length > 0 ? (
          <TransitionGroup>
            {Object.keys(children).map((childKey) => {
              const childBranch = children[childKey];
              return (
                <CSSTransition key={childBranch.bid} timeout={300} classNames="branch">
                  <div className="flex items-center notranslate mb-2">
                    <button
                      className="flex items-center text-left text-gray-700 dark:text-gray-200 hover:text-primary hover:underline notranslate"
                      onClick={() => shiftBranch(childBranch.path)}
                    >
                      <FaFolder className="mr-2 text-primary" />
                      {childKey}
                    </button>
                    <button
                      className="text-red-500 ml-2 hover:text-red-700 notranslate"
                      onClick={() => openDeleteModal(childBranch.path, childKey)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </CSSTransition>
              );
            })}
          </TransitionGroup>
        ) : (
          <p className="text-gray-500 dark:text-gray-400"></p>
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

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && branchToDelete && (
        <ModalDelete
          isOpen={isDeleteModalOpen}
          closeModal={closeDeleteModal}
          confirmDelete={confirmDelete}
          branchName={branchToDelete.name}
        />
      )}
    </div>
  );
}
