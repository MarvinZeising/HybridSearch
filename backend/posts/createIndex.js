import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import deployModel from '../models/deployModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function hasIndex() {
  try {
    const response = await axios.get('http://opensearch:9200/posts');
    if (response.data.status === 404) {
      return false
    }
  } catch (error) {
    return false
  }

  return true
}

async function createIndex() {
  try {
    await Promise.all([
      createIndexTemplate(),
      createSearchPipeline(),
      deployModel('cross-encoder.json').then(createSearchPipelineReranked),
      deployModel('sentence-transformer.json').then(createIngestPipeline),
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
  const pipeline = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts-ingest-pipeline.json'), 'utf8').replace(/MODEL_ID/gm, modelId));
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/posts-ingest-pipeline`, pipeline);
  console.log('Created Ingest Pipeline: ', response.data)
}

async function createSearchPipeline() {
  const pipeline = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts-search-pipeline.json'), 'utf8'));
  const response = await axios.put(`http://opensearch:9200/_search/pipeline/posts-search-pipeline`, pipeline);
  console.log('Created Search Pipeline: ', response.data)
}

async function createSearchPipelineReranked(modelId) {
  const pipeline = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts-search-pipeline-reranked.json'), 'utf8').replace(/MODEL_ID/gm, modelId));
  const response = await axios.put(`http://opensearch:9200/_search/pipeline/posts-search-pipeline-reranked`, pipeline);
  console.log('Created Search Pipeline Reranked: ', response.data)
}

async function getSentenceTransformerModelId() {
  try {
    const response = await axios.get('http://opensearch:9200/_ingest/pipeline/posts-ingest-pipeline')
    return response.data['posts-ingest-pipeline'].processors[0].text_embedding.model_id
  } catch (error) {
    throw new Error(error.data)
  }
}

export { createIndex, hasIndex, getSentenceTransformerModelId };
