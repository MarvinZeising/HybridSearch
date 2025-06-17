export interface NewsPost {
  _id?: string;
  title: string;
  description: string;
  content: string;
  createdAt?: string;
}

export interface NewsFormData {
  title: string;
  description: string;
  content: string;
}
