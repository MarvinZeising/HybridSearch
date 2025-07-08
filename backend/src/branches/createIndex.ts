import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createBranchIndexes(sentenceTransformerModelId: string, rerankerModelId: string): Promise<void> {
  try {
    await Promise.all([
      createBranchesIndexTemplate(),
      createBranchesSearchPipeline(sentenceTransformerModelId, rerankerModelId),
      createPostsBranchIngestPipeline(sentenceTransformerModelId),
      createPagesBranchIngestPipeline(sentenceTransformerModelId),
      createUsersBranchIngestPipeline(sentenceTransformerModelId),
    ]);
    console.log(`Successfully created model, pipeline, and index template for branches`);
  } catch (error: any) {
    console.error('Error creating OpenSearch index for branches:', error.message, error.response && error.response.data);
    throw error;
  }
}

async function createBranchesIndexTemplate(): Promise<void> {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets', 'branches-template.json'), 'utf8'));
  const response = await axios.put(`http://opensearch:9200/_index_template/branches`, schema);
  console.log('Created Branches Index Template: ', response.data);
}

async function createBranchesSearchPipeline(sentenceTransformerModelId: string, rerankerModelId: string): Promise<void> {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'assets', 'branches-search-pipeline.json'), 'utf8')
      .replace(/RERANKER_MODEL_ID/gm, rerankerModelId)
      .replace(/MODEL_ID/gm, sentenceTransformerModelId)
  );
  const response = await axios.put(`http://opensearch:9200/_search/pipeline/branches-search-pipeline`, pipeline);
  console.log('Created Branches Search Pipeline: ', response.data);
}

async function createPostsBranchIngestPipeline(modelId: string): Promise<void> {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'assets', 'posts-branch-ingest-pipeline.json'), 'utf8')
      .replace(/MODEL_ID/gm, modelId)
  );
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/posts-branch-ingest-pipeline`, pipeline);
  console.log('Created Posts Branch Ingest Pipeline: ', response.data);
}

async function createPagesBranchIngestPipeline(modelId: string): Promise<void> {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'assets', 'pages-branch-ingest-pipeline.json'), 'utf8')
      .replace(/MODEL_ID/gm, modelId)
  );
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/pages-branch-ingest-pipeline`, pipeline);
  console.log('Created Pages Branch Ingest Pipeline: ', response.data);
}

async function createUsersBranchIngestPipeline(modelId: string): Promise<void> {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'assets', 'users-branch-ingest-pipeline.json'), 'utf8')
      .replace(/MODEL_ID/gm, modelId)
  );
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/users-branch-ingest-pipeline`, pipeline);
  console.log('Created Users Branch Ingest Pipeline: ', response.data);
}

export async function purgeBranchIndexes(): Promise<void> {
  try {
    console.log('Purging branch indexes, templates, and pipelines...');
    await Promise.all([
      axios.delete('http://opensearch:9200/branch-*'),
      axios.delete('http://opensearch:9200/_index_template/branches'),
      axios.delete('http://opensearch:9200/_search/pipeline/branches-search-pipeline'),
      axios.delete('http://opensearch:9200/_ingest/pipeline/posts-branch-ingest-pipeline'),
      axios.delete('http://opensearch:9200/_ingest/pipeline/pages-branch-ingest-pipeline'),
      axios.delete('http://opensearch:9200/_ingest/pipeline/users-branch-ingest-pipeline'),
    ]);
    console.log('Successfully purged all branch indexes and pipelines');
  } catch (error) {
    console.log('Note: Some purge operations failed (this is normal if indexes don\'t exist yet)');
  }
}
