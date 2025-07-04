export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  managerId?: User | null;
  employeeId: string;
  hireDate: string;
  isActive: boolean;
  phone?: string;
  location?: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
  fullName?: string; // Virtual field from backend
  score?: number; // Search relevance score
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  managerId?: string | null;
  employeeId: string;
  phone?: string;
  location?: string;
  profilePhoto?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  managerId?: string | null;
  employeeId?: string;
  phone?: string;
  location?: string;
  profilePhoto?: string;
  isActive?: boolean;
}
