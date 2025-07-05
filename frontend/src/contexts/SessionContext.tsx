import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// CEO/Branch definitions
export interface CEO {
  id: string;
  name: string;
  title: string;
  company: string;
  branchId: string;
  employeeId: string;
  location: string;
  email: string;
  profilePhoto: string;
}

export const CEOS: CEO[] = [
  {
    id: 'branch1',
    name: 'Sarah Johnson',
    title: 'Chief Executive Officer',
    company: 'TechCorp US',
    branchId: 'branch1',
    employeeId: 'EMP001',
    location: 'New York',
    email: 'sarah.johnson@company.com',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahJohnson&backgroundColor=b6e3f4'
  },
  {
    id: 'branch2',
    name: 'Henrik Andersson',
    title: 'Chief Executive Officer',
    company: 'TechConsult Europe',
    branchId: 'branch2',
    employeeId: 'EMP021',
    location: 'Stockholm',
    email: 'henrik.andersson@techconsult.eu',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HenrikAndersson&backgroundColor=b6e3f4'
  },
  {
    id: 'branch3',
    name: 'Takeshi Yamamoto',
    title: 'Chief Executive Officer',
    company: 'Asia Pacific Manufacturing',
    branchId: 'branch3',
    employeeId: 'EMP031',
    location: 'Tokyo',
    email: 'takeshi.yamamoto@asiapacific.com',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TakeshiYamamoto&backgroundColor=b6e3f4'
  }
];

interface SessionContextType {
  currentCEO: CEO;
  switchCEO: (ceoId: string) => void;
  currentBranchId: string;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [currentCEO, setCurrentCEO] = useState<CEO>(() => {
    // Try to load from localStorage, default to first CEO
    const savedCEOId = localStorage.getItem('currentCEO');
    const foundCEO = CEOS.find(ceo => ceo.id === savedCEOId);
    return foundCEO || CEOS[0];
  });

  const switchCEO = (ceoId: string) => {
    const ceo = CEOS.find(c => c.id === ceoId);
    if (ceo) {
      setCurrentCEO(ceo);
      localStorage.setItem('currentCEO', ceoId);
    }
  };

  useEffect(() => {
    // Save to localStorage whenever currentCEO changes
    localStorage.setItem('currentCEO', currentCEO.id);
  }, [currentCEO]);

  const value: SessionContextType = {
    currentCEO,
    switchCEO,
    currentBranchId: currentCEO.branchId
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
