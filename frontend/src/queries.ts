import axios from 'axios';
import type { NewsPost, NewsFormData } from './types/news';
import type { Page, PageFormData } from './types/pages';
import type { User, CreateUserRequest, UpdateUserRequest } from './types/users';
import type { SearchRequest, MultiSearchResponse, Branch } from './types/search';

export const fetchAllPosts = async (): Promise<NewsPost[]> => {
  const response = await axios.get<NewsPost[]>('http://localhost:4000/api/news');
  return response.data;
};

export const searchPosts = async ({ query, useReranking }: { query: string, useReranking: boolean }): Promise<NewsPost[]> => {
  const endpoint = useReranking ? '/api/news/search-reranked' : '/api/news/search';
  const response = await axios.post<NewsPost[]>(`http://localhost:4000${endpoint}`, {query});
  return response.data;
};

export const fetchPostById = async (id: string): Promise<NewsPost> => {
  const response = await axios.get<NewsPost>(`http://localhost:4000/api/news/${id}`);
  return response.data;
};

export const deletePost = async (id: string): Promise<void> => {
  await axios.delete(`http://localhost:4000/api/news/${id}`);
};

// Page queries
export const fetchAllPages = async (): Promise<Page[]> => {
  const response = await axios.get<Page[]>('http://localhost:4000/api/pages');
  return response.data;
};

export const searchPages = async ({ query, useReranking }: { query: string, useReranking: boolean }): Promise<Page[]> => {
  const endpoint = useReranking ? '/api/pages/search-reranked' : '/api/pages/search';
  const response = await axios.post<Page[]>(`http://localhost:4000${endpoint}`, {query});
  return response.data;
};

export const fetchPageById = async (id: string): Promise<Page> => {
  const response = await axios.get<Page>(`http://localhost:4000/api/pages/${id}`);
  return response.data;
};

export const deletePage = async (id: string): Promise<void> => {
  await axios.delete(`http://localhost:4000/api/pages/${id}`);
};

// User queries
export const fetchAllUsers = async (): Promise<User[]> => {
  const response = await axios.get<User[]>('http://localhost:4000/api/users');
  return response.data;
};

export const fetchUserById = async (id: string): Promise<User> => {
  const response = await axios.get<User>(`http://localhost:4000/api/users/${id}`);
  return response.data;
};

export const createUser = async (userData: CreateUserRequest): Promise<User> => {
  const response = await axios.post<User>('http://localhost:4000/api/users', userData);
  return response.data;
};

export const updateUser = async (id: string, userData: UpdateUserRequest): Promise<User> => {
  const response = await axios.put<User>(`http://localhost:4000/api/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await axios.delete(`http://localhost:4000/api/users/${id}`);
};

export const fetchUsersByDepartment = async (department: string): Promise<User[]> => {
  const response = await axios.get<User[]>(`http://localhost:4000/api/users/department/${department}`);
  return response.data;
};

export const fetchUsersByManager = async (managerId: string): Promise<User[]> => {
  const response = await axios.get<User[]>(`http://localhost:4000/api/users/manager/${managerId}`);
  return response.data;
};

export const searchUsers = async ({ query, useReranking }: { query: string, useReranking: boolean }): Promise<User[]> => {
  const endpoint = useReranking ? '/api/users/search-reranked' : '/api/users/search';
  const response = await axios.post<User[]>(`http://localhost:4000${endpoint}`, {query});
  return response.data;
};

export const multiSearch = async (query: string, useReranking: boolean = false, branchId: string): Promise<MultiSearchResponse> => {
  const response = await axios.post<MultiSearchResponse>('http://localhost:4000/api/search', {
    query,
    useReranking: useReranking || false,
    branchId: branchId
  });
  return response.data;
};

// Branch queries
export const fetchAllBranches = async (): Promise<Branch[]> => {
  const response = await axios.get<Branch[]>('http://localhost:4000/api/branches');
  return response.data;
};

export const fetchBranchById = async (id: string): Promise<Branch> => {
  const response = await axios.get<Branch>(`http://localhost:4000/api/branches/${id}`);
  return response.data;
};

export const createBranch = async (branchData: Omit<Branch, '_id' | 'createdAt' | 'updatedAt'>): Promise<Branch> => {
  const response = await axios.post<Branch>('http://localhost:4000/api/branches', branchData);
  return response.data;
};

export const updateBranch = async (id: string, branchData: Partial<Omit<Branch, '_id'>>): Promise<Branch> => {
  const response = await axios.put<Branch>(`http://localhost:4000/api/branches/${id}`, branchData);
  return response.data;
};

export const deleteBranch = async (id: string): Promise<void> => {
  await axios.delete(`http://localhost:4000/api/branches/${id}`);
};

export const searchBranches = async ({ query, useReranking, branchId }: SearchRequest & { branchId?: string }): Promise<Branch[]> => {
  const endpoint = useReranking ? '/api/branches/search-reranked' : '/api/branches/search';
  const response = await axios.post<Branch[]>(`http://localhost:4000${endpoint}`, { query, branchId });
  return response.data;
};
