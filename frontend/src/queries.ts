import axios from 'axios';
import type { NewsPost } from './types/news';
import type { Page } from './types/pages';
import type { User, CreateUserRequest, UpdateUserRequest } from './types/users';
import type { MultiSearchResponse } from './types/search';

export const fetchAllPosts = async (): Promise<NewsPost[]> => {
  const response = await axios.get<NewsPost[]>('http://localhost:4000/api/news');
  return response.data;
};

export const searchPosts = async ({ query, branchId }: { query: string, branchId: string }): Promise<NewsPost[]> => {
  const response = await axios.post<NewsPost[]>('http://localhost:4000/api/news/search', {query, branchId});
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

export const searchPages = async ({ query, branchId }: { query: string, branchId: string }): Promise<Page[]> => {
  const response = await axios.post<Page[]>('http://localhost:4000/api/pages/search', {query, branchId});
  return response.data;
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

export const searchUsers = async ({ query, branchId }: { query: string, branchId: string }): Promise<User[]> => {
  const response = await axios.post<User[]>('http://localhost:4000/api/users/search', {query, branchId});
  return response.data;
};

// Branch queries
export const branchSearch = async (query: string, branchId: string): Promise<MultiSearchResponse> => {
  const response = await axios.post<MultiSearchResponse>(`http://localhost:4000/api/branches/${branchId}/search`, {query});
  return response.data;
};
