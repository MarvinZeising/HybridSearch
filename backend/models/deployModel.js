import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const MODEL_INDEX = 'ml-model-ids';

async function getStoredModelId(modelType) {
  try {
    const { data } = await axios.get(`http://opensearch:9200/${MODEL_INDEX}/_search`, {
      params: { q: `modelType:${modelType}` }
    });
    if (data.hits.total.value > 0) {
      return data.hits.hits[0]._source.modelId;
    }
    return null;
  } catch (err) {
    if (err.response && err.response.status === 404) return null;
    throw err;
  }
}

async function storeModelId(modelType, modelId) {
  await axios.post(`http://opensearch:9200/${MODEL_INDEX}/_doc`, {
    modelType,
    modelId,
    createdAt: new Date().toISOString()
  });
}

async function deployModel(fileName) {
  // Determine modelType from fileName
  let modelType;
  if (fileName.includes('sentence-transformer')) modelType = 'sentence-transformer';
  else if (fileName.includes('cross-encoder')) modelType = 'cross-encoder';
  else modelType = fileName;

  // Try to get existing modelId
  const existingModelId = await getStoredModelId(modelType);
  if (existingModelId) {
    console.log(`Found existing modelId for ${modelType}: ${existingModelId}`);
    return existingModelId;
  }

  // Deploy new model
  const model = JSON.parse(fs.readFileSync(path.join(__dirname, fileName), 'utf8'));
  console.log('Deploying model ' + model.name + ' ...')

  try {
    const response = await axios.post('http://opensearch:9200/_plugins/_ml/models/_register?deploy=true', model)

    let i = 0
    let modelId;
    do {
      try {
        modelId = await getModelIdByTask(response.data.task_id)
        break;
      } catch (error) {
        await sleep(3);
      }
    } while (i++ < 60)

    if (!modelId) throw new Error('Model did not deploy within 3 minutes')

    // Store modelId for future use
    await storeModelId(modelType, modelId);
    return modelId;
  } catch (error) {
    console.error('Error deploying model:', error.response?.data || error);
    throw error;
  }
}

async function getModelIdByTask(taskId) {
  const task = (await axios.get("http://opensearch:9200/_plugins/_ml/tasks/" + taskId)).data
  if (task.state === "COMPLETED") {
    return task.model_id
  }
  throw new Error('not completed')
}

export default deployModel;
