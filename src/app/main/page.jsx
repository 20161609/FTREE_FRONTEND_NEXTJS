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
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/router';

export default function MainPage() {
  const router = useRouter();

  // 상태 변수들
  const [transactions, setTransactions] = useState([]);
  const [tree, setTree] = useState(null);
  const [branch, setBranch] = useState(null);
  const [curPath, setCurPath] = useState('Home');

  // 모달 상태 변수들
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 사용자 정보 상태 변수들
  const [useAI, setUseAI] = useState(true);
  const [username, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // 모달 열기/닫기 함수들
  const openReport = () => setIsReportOpen(true);
  const closeReport = () => setIsReportOpen(false);

  const getBackToLogin = () => {
    router.push('/');
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
      router.push('/');
    }
  };

  const closeSettings = () => setIsSettingsOpen(false);

  // 트리 데이터 초기화
  const initTree = async () => {
    try {
      const data = await api_get_tree();
      console.log('data', 'begin');
      console.log(data);
      console.log('data', 'end');

      setTree(data);

      let curBranch = data['Home'];
      const pathParts = curPath.split('/').slice(1);
      curBranch = pathParts.reduce((branch, part) => branch.children[part], curBranch);
      setBranch(curBranch);
    } catch (error) {
      console.error('initTree error:', error);
      alert('트리 초기화에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 현재 브랜치 경로에 따른 거래 내역 초기화
  const initTransactions = async (curBranchPath = 'Home') => {
    try {
      const data = await api_refer_daily(curBranchPath);
      setTransactions(data);
    } catch (error) {
      console.error('api_refer_daily error:', error);
      alert('거래 내역 로딩에 실패했습니다. 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    // 로그인 상태 확인
    const checkLogin = async () => {
      try {
        const user = await api_get_user_info();
        if (!user) {
          router.push('/');
          return;
        }
        setUsername(user.username);
        setUserEmail(user.email);
        await initTree();
        await initTransactions();
      } catch (error) {
        console.error('checkLogin error:', error);
        router.push('/');
      }
    };

    checkLogin();
  }, []);

  // 브랜치 경로 가져오기
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

  // 브랜치 이동
  const shiftBranch = async (branchPath) => {
    if (branchPath === curPath) return;

    try {
      let pathList = branchPath.split('/');
      let node = tree['Home'];
      for (let i = 1; i < pathList.length; i++) {
        node = node.children[pathList[i]];
      }
      setBranch(node);
      setCurPath(branchPath);
      await initTransactions(branchPath);
    } catch (error) {
      console.error('shiftBranch error:', error);
      alert('브랜치 이동에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 트리나 브랜치 데이터가 아직 로드되지 않았다면 로딩 스피너를 표시
  if (!tree || !branch) {
    return <LoadingSpinner />; // 로딩 중에는 로딩 스피너를 표시
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          {/* 로고 또는 제목 */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Finance Tree</h1>
          {/* 버튼 그룹 */}
          <div className="flex space-x-4">
            {/* 리포트 버튼 */}
            <button
              className="text-gray-700 dark:text-gray-200 hover:text-blue-500"
              onClick={openReport}
            >
              리포트
            </button>
            {/* 설정 버튼 */}
            <button
              className="text-gray-700 dark:text-gray-200 hover:text-blue-500"
              onClick={openSettings}
            >
              <Cog6ToothIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {/* 브랜치 경로 네비게이션 */}
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

          {/* 브랜치 리스트와 거래 내역 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 자식 브랜치 리스트 */}
            <div className="col-span-1">
              <BranchTree
                branch={branch}
                shiftBranch={shiftBranch}
                initTree={initTree}
                initTransactions={initTransactions}
              />
            </div>
            {/* 거래 내역 */}
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

      {/* 리포트 모달 */}
      <ModalReport
        isOpen={isReportOpen}
        closeModal={closeReport}
        transactions={transactions}
        branch={branch}
      />

      {/* 설정 모달 */}
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
