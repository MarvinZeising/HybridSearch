import React, { useState } from 'react';
import { useSession, CEOS } from '../contexts/SessionContext';
import type { CEO } from '../contexts/SessionContext';

const CEOSelector: React.FC = () => {
  const { currentCEO, switchCEO } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const handleCEOChange = (ceo: CEO) => {
    switchCEO(ceo.id);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <img
          src={currentCEO.profilePhoto}
          alt={currentCEO.name}
          className="w-8 h-8 rounded-full"
        />
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900">{currentCEO.name}</div>
          <div className="text-xs text-gray-500">{currentCEO.company}</div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
              Switch Branch
            </div>
            {CEOS.map((ceo) => (
              <button
                key={ceo.id}
                onClick={() => handleCEOChange(ceo)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  currentCEO.id === ceo.id
                    ? 'bg-blue-50 text-blue-900'
                    : 'hover:bg-gray-50'
                }`}
              >
                <img
                  src={ceo.profilePhoto}
                  alt={ceo.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{ceo.name}</div>
                  <div className="text-xs text-gray-500">{ceo.title}</div>
                  <div className="text-xs font-medium text-gray-700">{ceo.company}</div>
                  <div className="text-xs text-gray-500">{ceo.location}</div>
                </div>
                {currentCEO.id === ceo.id && (
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CEOSelector;
