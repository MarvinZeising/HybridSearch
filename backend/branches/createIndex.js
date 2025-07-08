import axios from 'axios';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createBranchIndexes(sentenceTransformerModelId, rerankerModelId) {
  try {
    await Promise.all([
      createBranchesIndexTemplate(),
      createBranchesSearchPipeline(sentenceTransformerModelId, rerankerModelId),
      createPostsBranchIngestPipeline(sentenceTransformerModelId),
      createPagesBranchIngestPipeline(sentenceTransformerModelId),
      createUsersBranchIngestPipeline(sentenceTransformerModelId),
    ])
    console.log(`Successfully created model, pipeline, and index template for branches`);
  } catch (error) {
    console.error('Error creating OpenSearch index for branches:', error.message, error.response && error.response.data);
    throw error;
  }
}

async function createBranchesIndexTemplate() {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, 'branches-template.json'), 'utf8'));
  const response = await axios.put(`http://opensearch:9200/_index_template/branches`, schema);
  console.log('Created Branches Index Template: ', response.data)
}

async function createBranchesSearchPipeline(sentenceTransformerModelId, rerankerModelId) {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'branches-search-pipeline.json'), 'utf8')
      .replace(/RERANKER_MODEL_ID/gm, rerankerModelId)
      .replace(/MODEL_ID/gm, sentenceTransformerModelId)
  );
  const response = await axios.put(`http://opensearch:9200/_search/pipeline/branches-search-pipeline`, pipeline);
  console.log('Created Branches Search Pipeline: ', response.data)
}

async function createPostsBranchIngestPipeline(modelId) {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'posts-branch-ingest-pipeline.json'), 'utf8')
      .replace(/MODEL_ID/gm, modelId)
  );
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/posts-branch-ingest-pipeline`, pipeline);
  console.log('Created Posts Branch Ingest Pipeline: ', response.data)
}

async function createPagesBranchIngestPipeline(modelId) {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'pages-branch-ingest-pipeline.json'), 'utf8')
      .replace(/MODEL_ID/gm, modelId)
  );
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/pages-branch-ingest-pipeline`, pipeline);
  console.log('Created Pages Branch Ingest Pipeline: ', response.data)
}

async function createUsersBranchIngestPipeline(modelId) {
  const pipeline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'users-branch-ingest-pipeline.json'), 'utf8')
      .replace(/MODEL_ID/gm, modelId)
  );
  const response = await axios.put(`http://opensearch:9200/_ingest/pipeline/users-branch-ingest-pipeline`, pipeline);
  console.log('Created Users Branch Ingest Pipeline: ', response.data)
}

async function purgeBranchIndexes() {
  try {
    console.log('Purging branch indexes, templates, and pipelines...');

    await Promise.all([
      // Delete all branch indexes
      axios.delete('http://opensearch:9200/branch-*'),
      // Delete index template
      axios.delete('http://opensearch:9200/_index_template/branches'),
      // Delete search pipeline
      axios.delete('http://opensearch:9200/_search/pipeline/branches-search-pipeline'),
      // Delete branch ingest pipelines
      axios.delete('http://opensearch:9200/_ingest/pipeline/posts-branch-ingest-pipeline'),
      axios.delete('http://opensearch:9200/_ingest/pipeline/pages-branch-ingest-pipeline'),
      axios.delete('http://opensearch:9200/_ingest/pipeline/users-branch-ingest-pipeline'),
    ]);
    console.log('Successfully purged all branch indexes and pipelines');
  } catch (error) {
    console.log('Note: Some purge operations failed (this is normal if indexes don\'t exist yet)');
  }
}

export { createBranchIndexes, purgeBranchIndexes };
