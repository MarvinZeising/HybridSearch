import axios from 'axios';
import type { NewsPost, NewsFormData } from './types/news';
import type { Page, PageFormData } from './types/pages';
import type { User, CreateUserRequest, UpdateUserRequest } from './types/users';

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
