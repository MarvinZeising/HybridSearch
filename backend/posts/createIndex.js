import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createPostsIndex(sentenceTransformerModelId, rerankerModelId) {
  try {
    await Promise.all([
      createIndexTemplate(),
      createIngestPipeline(sentenceTransformerModelId),
      createSearchPipeline(sentenceTransformerModelId, rerankerModelId),
    ])

    console.log(`Successfully created model, pipeline, and index template for posts`);
  } catch (error) {
    console.error('Error creating OpenSearch index:', error.message, error.response && error.response.data);
    throw error;
  }
}

async function createIndexTemplate() {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts-template.json'), 'utf8'));
  const response = await axios.put(`http://opensearch:9200/_index_template/posts`, schema);
  console.log('Created Index Template: ', response.data)
}

async function createIngestPipeline(modelId) {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'posts-ingest-pipeline.json'), 'utf8')
      .replace(/MODEL_ID/gm, modelId)
  );
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/posts-ingest-pipeline`, pipeline);
  console.log('Created Ingest Pipeline: ', response.data)
}



async function createSearchPipeline(sentenceTransformerModelId, rerankerModelId) {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'posts-search-pipeline.json'), 'utf8')
      .replace(/RERANKER_MODEL_ID/gm, rerankerModelId)
      .replace(/MODEL_ID/gm, sentenceTransformerModelId)
  );
  const response = await axios.put(`http://opensearch:9200/_search/pipeline/posts-search-pipeline`, pipeline);
  console.log('Created Search Pipeline: ', response.data)
}

async function getSentenceTransformerModelId() {
  try {
    const response = await axios.get('http://opensearch:9200/_ingest/pipeline/posts-ingest-pipeline')
    return response.data['posts-ingest-pipeline'].processors[2].text_embedding.model_id
  } catch (error) {
    throw new Error(error.data)
  }
}

async function createPagesIndex(sentenceTransformerModelId, rerankerModelId) {
  try {
    await Promise.all([
      createPagesIndexTemplate(),
      createPagesIngestPipeline(sentenceTransformerModelId),
      createPagesSearchPipeline(sentenceTransformerModelId, rerankerModelId),
    ])
    console.log(`Successfully created model, pipeline, and index template for pages`);
  } catch (error) {
    console.error('Error creating OpenSearch index for pages:', error.message, error.response && error.response.data);
    throw error;
  }
}

async function createPagesIndexTemplate() {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../pages/pages-template.json'), 'utf8'));
  const response = await axios.put(`http://opensearch:9200/_index_template/pages`, schema);
  console.log('Created Pages Index Template: ', response.data)
}

async function createPagesIngestPipeline(modelId) {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../pages/pages-ingest-pipeline.json'), 'utf8')
      .replace(/MODEL_ID/gm, modelId)
  );
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/pages-ingest-pipeline`, pipeline);
  console.log('Created Pages Ingest Pipeline: ', response.data)
}



async function createPagesSearchPipeline(sentenceTransformerModelId, rerankerModelId) {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../pages/pages-search-pipeline.json'), 'utf8')
      .replace(/RERANKER_MODEL_ID/gm, rerankerModelId)
      .replace(/MODEL_ID/gm, sentenceTransformerModelId)
  );
  const response = await axios.put(`http://opensearch:9200/_search/pipeline/pages-search-pipeline`, pipeline);
  console.log('Created Pages Search Pipeline: ', response.data)
}

async function createUsersIndex(sentenceTransformerModelId, rerankerModelId) {
  try {
    await Promise.all([
      createUsersIndexTemplate(),
      createUsersIngestPipeline(sentenceTransformerModelId),
      createUsersSearchPipeline(sentenceTransformerModelId, rerankerModelId),
    ])
    console.log(`Successfully created model, pipeline, and index template for users`);
  } catch (error) {
    console.error('Error creating OpenSearch index for users:', error.message, error.response && error.response.data);
    throw error;
  }
}

async function createUsersIndexTemplate() {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../users/users-template.json'), 'utf8'));
  const response = await axios.put(`http://opensearch:9200/_index_template/users`, schema);
  console.log('Created Users Index Template: ', response.data)
}

async function createUsersIngestPipeline(modelId) {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../users/users-ingest-pipeline.json'), 'utf8')
      .replace(/MODEL_ID/gm, modelId)
  );
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/users-ingest-pipeline`, pipeline);
  console.log('Created Users Ingest Pipeline: ', response.data)
}



async function createUsersSearchPipeline(sentenceTransformerModelId, rerankerModelId) {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../users/users-search-pipeline.json'), 'utf8')
      .replace(/RERANKER_MODEL_ID/gm, rerankerModelId)
      .replace(/MODEL_ID/gm, sentenceTransformerModelId)
  );
  const response = await axios.put(`http://opensearch:9200/_search/pipeline/users-search-pipeline`, pipeline);
  console.log('Created Users Search Pipeline: ', response.data)
}

export { createPostsIndex, getSentenceTransformerModelId, createPagesIndex, createUsersIndex };
