const axios = require('axios');
const fs = require('fs');
const path = require('path');

const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

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

async function deployModel() {
  const model = JSON.parse(fs.readFileSync(path.join(__dirname, 'model.json'), 'utf8'));
  console.log('Deploying model ' + model.name + ' ...')

  const response = await axios.post('http://opensearch:9200/_plugins/_ml/models/_register?deploy=true', model)

  let i = 0
  do {
    try {
      return await tryGetModelId(response.data.task_id)
    } catch (error) {
      await sleep(3);
    }
  } while (i++ < 60)

  throw new Error('Model did not deploy within 3 minutes')
}

async function tryGetModelId(taskId) {
  const task = (await axios.get("http://opensearch:9200/_plugins/_ml/tasks/" + taskId)).data
  if (task.state === "COMPLETED") {
    return task.model_id
  }
  throw new Error('not completed')
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

module.exports = { createIndex, hasIndex, getModelId };
