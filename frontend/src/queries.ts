import type {NewsPost} from "./types/news.ts";
import axios from "axios";

export const fetchAllPosts = async (): Promise<NewsPost[]> => {
  const response = await axios.get<NewsPost[]>('http://localhost:4000/api/news');
  return response.data;
};

export const searchPosts = async ({query, useReranking}: {
  query: string;
  useReranking: boolean
}): Promise<NewsPost[]> => {
  const endpoint = useReranking ? '/api/news/search-reranked' : '/api/news/search';
  const response = await axios.post<NewsPost[]>(`http://localhost:4000${endpoint}`, {query});
  return response.data;
};
