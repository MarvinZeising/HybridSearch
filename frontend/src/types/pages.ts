export interface Page {
  _id?: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  isPublished: boolean;
}
