import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createPagesIndex(sentenceTransformerModelId: string, rerankerModelId: string): Promise<void> {
  try {
    await Promise.all([
      createIndexTemplate(),
      createIngestPipeline(sentenceTransformerModelId),
      createSearchPipeline(sentenceTransformerModelId, rerankerModelId),
    ]);
    console.log(`Successfully created model, pipeline, and index template for pages`);
  } catch (error: any) {
    console.error('Error creating OpenSearch index:', error.message, error.response && error.response.data);
    throw error;
  }
}

async function createIndexTemplate(): Promise<void> {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets', 'pages-template.json'), 'utf8'));
  const response = await axios.put(`http://opensearch:9200/_index_template/pages`, schema);
  console.log('Created Index Template: ', response.data);
}

async function createIngestPipeline(modelId: string): Promise<void> {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'assets', 'pages-ingest-pipeline.json'), 'utf8')
      .replace(/MODEL_ID/gm, modelId)
  );
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/pages-ingest-pipeline`, pipeline);
  console.log('Created Ingest Pipeline: ', response.data);
}

async function createSearchPipeline(sentenceTransformerModelId: string, rerankerModelId: string): Promise<void> {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'assets', 'pages-search-pipeline.json'), 'utf8')
      .replace(/RERANKER_MODEL_ID/gm, rerankerModelId)
      .replace(/MODEL_ID/gm, sentenceTransformerModelId)
  );
  const response = await axios.put(`http://opensearch:9200/_search/pipeline/pages-search-pipeline`, pipeline);
  console.log('Created Search Pipeline: ', response.data);
}

export async function purgePagesIndexes(): Promise<void> {
  try {
    console.log('Purging pages indexes, templates, and pipelines...');
    await Promise.all([
      axios.delete('http://opensearch:9200/pages'),
      axios.delete('http://opensearch:9200/_index_template/pages'),
      axios.delete('http://opensearch:9200/_ingest/pipeline/pages-ingest-pipeline'),
      axios.delete('http://opensearch:9200/_search/pipeline/pages-search-pipeline'),
    ]);
    console.log('Successfully purged all pages indexes and pipelines');
  } catch (error) {
    console.log('Note: Some purge operations failed (this is normal if indexes don\'t exist yet)');
  }
}
