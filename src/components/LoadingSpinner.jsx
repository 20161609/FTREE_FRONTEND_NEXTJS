// src/components/LoadingSpinner.js

export default function LoadingSpinner() {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid border-gray-200"></div>
      </div>
    );
  }
  