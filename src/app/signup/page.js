// src/app/signup/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api_check_verify, api_signup, api_signin } from '@/libs/api_user';
import { api_send_verify_code } from '@/libs/api_user';

export default function SignupPage() {
  const router = useRouter();

  // 비밀번호를 제외한 formData 상태 관리
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    verificationCode: '',
  });

  // 비밀번호는 별도로 상태 관리 (localStorage에 저장되지 않도록)
  const [password, setPassword] = useState('');

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 컴포넌트가 마운트될 때 localStorage에서 상태 복원
  useEffect(() => {
    const savedFormData = localStorage.getItem('signupFormData');
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }

    const codeSent = localStorage.getItem('signupIsCodeSent');
    if (codeSent) {
      setIsCodeSent(JSON.parse(codeSent));
    }

    const verified = localStorage.getItem('signupIsVerified');
    if (verified) {
      setIsVerified(JSON.parse(verified));
    }
  }, []);

  // formData가 변경될 때마다 localStorage에 저장 (비밀번호 제외)
  useEffect(() => {
    localStorage.setItem('signupFormData', JSON.stringify(formData));
  }, [formData]);

  // isCodeSent가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('signupIsCodeSent', JSON.stringify(isCodeSent));
  }, [isCodeSent]);

  // isVerified가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('signupIsVerified', JSON.stringify(isVerified));
  }, [isVerified]);

  // 컴포넌트가 언마운트될 때 localStorage에서 상태 제거 (회원가입 성공 시에만)
  useEffect(() => {
    return () => {
      if (isVerified) {
        localStorage.removeItem('signupFormData');
        localStorage.removeItem('signupIsCodeSent');
        localStorage.removeItem('signupIsVerified');
      }
    };
  }, [isVerified]);

  // 비밀번호 검증 함수
  function validatePassword(password) {
    const errors = [];

    // 우선순위 1: 최소 8자 이상
    if (password.length < 8) {
      errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
      return errors; // 조건 불충족 시 즉시 반환
    }

    // 우선순위 2: 최소 하나의 소문자 포함
    if (!/[a-z]/.test(password)) {
      errors.push('비밀번호는 최소 하나의 소문자를 포함해야 합니다.');
      return errors; // 조건 불충족 시 즉시 반환
    }

    // 우선순위 3: 허용된 특수 문자 또는 영숫자만 사용
    const validSymbols = '!@#$%^&*-+';
    for (let i = 0; i < password.length; i++) {
      const char = password[i];
      if (!/[a-zA-Z0-9]/.test(char) && !validSymbols.includes(char)) {
        errors.push('비밀번호는 다음 특수 문자만 사용할 수 있습니다: !@#$%^&*-+');
        return errors; // 조건 불충족 시 즉시 반환
      }
    }

    // 우선순위 4: 최소 하나의 숫자 포함
    if (!/[0-9]/.test(password)) {
      errors.push('비밀번호는 최소 하나의 숫자를 포함해야 합니다.');
      return errors; // 조건 불충족 시 즉시 반환
    }

    return errors;
  }

  // 인증 코드 전송 핸들러
  const handleSendCode = async () => {
    setError('');
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('유효한 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const res = await api_send_verify_code(formData.email);
      console.log(res);
      // 오류 처리
      if (res == 409) {
        setError('이미 존재하는 이메일입니다.');
        setLoading(false);
        return;
      } else if (res == 404) {
        setError('인증 코드 전송에 실패했습니다. 다시 시도해주세요.');
        setLoading(false);
        return;
      } else if (res == 500) {
        setError('서버 오류가 발생했습니다.');
        setLoading(false);
        return;
      } else if (res != 200) {
        setError('알 수 없는 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      setIsCodeSent(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.status === 409) {
        setError('이미 존재하는 이메일입니다.');
      } else {
        setError('인증 코드 전송에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 인증 코드 확인 핸들러
  const handleVerifyCode = async () => {
    setError('');
    if (formData.verificationCode.trim() === '') {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const verified = await api_check_verify(formData.email, formData.verificationCode);
      if (verified) {
        setIsVerified(true);
        setLoading(false);
      } else {
        setLoading(false);
        setError('잘못된 인증 코드입니다.');
      }
    } catch (err) {
      setLoading(false);
      setError('인증에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 회원가입 핸들러
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // 이메일 인증 완료 여부 확인
    if (!isVerified) {
      setError('이메일 인증을 완료해주세요.');
      return;
    }

    // 비밀번호 오류 확인
    if (passwordErrors.length > 0) {
      setError('비밀번호 조건을 모두 충족시켜주세요.');
      return;
    }

    try {
      setLoading(true);
      await api_signup(formData.email, password, formData.name);
      // 회원가입 성공 시 localStorage에서 상태 제거
      localStorage.removeItem('signupFormData');
      localStorage.removeItem('signupIsCodeSent');
      localStorage.removeItem('signupIsVerified');
      setLoading(false);
      // 로그인 및 리다이렉션
      await api_signin(formData.email, password);
      router.push('/');
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            회원가입
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* 이메일 입력 및 인증 코드 전송 버튼 */}
            <div className="flex flex-col">
              <div className="flex items-center">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="이메일"
                  disabled={isCodeSent}
                />
                {!isCodeSent && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="ml-2 px-2 py-2 bg-green-600 text-ts text-white rounded-md hover:bg-green-700 focus:outline-none"
                    disabled={loading}
                  >
                    {loading ? '전송 중...' : '전송'}
                  </button>
                )}
              </div>
              {/* 인증 코드 입력 필드 */}
              {isCodeSent && (
                <div className="mt-4 flex items-center">
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    value={formData.verificationCode}
                    onChange={(e) =>
                      setFormData({ ...formData, verificationCode: e.target.value })
                    }
                    className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="인증 코드"
                  />
                  {!isVerified && (
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
                      disabled={loading}
                    >
                      {loading ? '인증 중...' : '인증'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 이름 입력 필드 */}
            <div>
              <label htmlFor="name" className="sr-only">
                이름
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="이름"
                disabled={!isVerified}
              />
            </div>

            {/* 비밀번호 입력 필드 */}
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  const pwd = e.target.value;
                  setPassword(pwd);
                  const errors = validatePassword(pwd);
                  setPasswordErrors(errors);
                }}
                className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="비밀번호"
                disabled={!isVerified}
              />
              {/* 비밀번호 검증 결과 표시 */}
              {passwordErrors.length > 0 ? (
                <ul className="text-red-500 text-sm mt-1">
                  {passwordErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              ) : password && (
                <p className="text-green-500 text-sm mt-1">비밀번호 조건을 모두 충족했습니다.</p>
              )}
            </div>
          </div>

          {/* 오류 메시지 표시 */}
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* 회원가입 버튼 */}
          <div>
            <button
              type="submit"
              disabled={!isVerified || passwordErrors.length > 0 || loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isVerified && passwordErrors.length === 0
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              {loading ? '회원가입 중...' : '회원가입'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
            <a
              href="/"
              className="font-medium text-green-600 dark:text-green-400 hover:underline"
            >
              로그인
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
