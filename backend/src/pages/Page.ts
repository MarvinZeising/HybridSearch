import mongoose, { Document, Model } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IPage extends Document {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema = new mongoose.Schema<IPage>({
  title: String,
  description: String,
  content: String,
  category: { type: String, default: 'General' },
  tags: [String],
  isPublished: { type: Boolean, default: true },
  branchId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

interface PageModel extends Model<IPage> {
  search(query: string, branchId: string): Promise<any[]>;
}

const Page = mongoose.model<IPage, PageModel>('Page', PageSchema);

PageSchema.statics.search = async function(query: string, branchId: string) {
  try {
    const searchBody = {
      query: {
        hybrid: {
          filter: {
            term: {
              branchId: branchId
            }
          },
          queries: [
            {
              multi_match: {
                query: query,
                fields: ['title^4', 'description^2', 'content'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            },
            {
              nested: {
                score_mode: 'max',
                path: 'embeddings',
                query: {
                  neural: {
                    'embeddings.knn': {
                      query_text: query,
                      k: 5
                    }
                  }
                }
              }
            }
          ]
        }
      },
      ext: {
        rerank: {
          query_context: {
            query_text: query
          }
        }
      }
    };
    const searchResponse = await axios.post(`http://opensearch:9200/pages/_search?search_pipeline=pages-search-pipeline`, searchBody);

    const hits = searchResponse.data.hits.hits;
    const pageIds = hits.map((hit: any) => hit._id);

    const plainPages = await this.find({
      _id: { $in: pageIds }
    });

    return plainPages.map((page: any) => {
      const score = hits.find((x: any) => x._id === page.id)._score;
      return { ...page._doc, score };
    }).sort((a: any, b: any) => b.score - a.score);
  } catch (error: any) {
    console.error('Search error:', error.response?.data || error);
    throw new Error('Failed to search pages');
  }
};

export async function initializeDefaultPages(): Promise<void> {
  try {
    console.log('Creating pages collection');

    await Page.createCollection();

    const count = await Page.countDocuments();
    if (count === 0) {
      console.log('No pages found, inserting default pages...');

      const defaultPagesPath = path.join(__dirname, 'assets', 'default-pages.json');
      const defaultPages = JSON.parse(fs.readFileSync(defaultPagesPath, 'utf8'));

      await Page.insertMany(defaultPages);

      console.log('Default pages inserted successfully');
    } else {
      console.log('Database already contains pages, skipping default pages insertion');
    }
  } catch (error) {
    console.error('Error inserting default pages:', error);
    throw error;
  }
}

export { Page };
