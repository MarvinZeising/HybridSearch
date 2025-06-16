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
      createSearchPipeline().then(createIndexTemplate),
      deployModel().then(createIngestPipeline)
    ])

    console.log(`Successfully created model, pipeline, and index template for posts`);
  } catch (error) {
    console.error('Error creating OpenSearch index:', error.message, error.response.data);
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
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/posts-pipeline`, pipeline);
  console.log('Created Ingest Pipeline: ', response.data)
};

async function createSearchPipeline() {
  const pipeline = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts-search-pipeline.json'), 'utf8'));
  const response = await axios.put(`http://opensearch:9200/_search/pipeline/posts-hybrid-search`, pipeline);
  console.log('Created Search Pipeline: ', response.data)
};

async function getModelId() {
  try {
    const response = await axios.get('http://opensearch:9200/_ingest/pipeline/posts-pipeline')
    return response.data['posts-pipeline'].processors[0].text_embedding.model_id
  } catch (error) {
    throw new Error(error.data)
  }
}

export { createIndex, hasIndex, getModelId };
