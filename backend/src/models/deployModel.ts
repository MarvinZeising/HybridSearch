import fs from "fs";
import path from "path";
import {fileURLToPath} from 'url';
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

export type Model = {
  id: string;
  slug: string;
  definition: ModelDefinition;
}

type ModelDefinition = {
  name: string;
}

async function ensureModelIsDeployed(modelId: string, slug: string): Promise<void> {
  try {
    const { data } = await axios.get(`http://opensearch:9200/_plugins/_ml/profile/models/${modelId}`);

    let isDeployed = false;

    for (const nodeId in data.nodes) {
      const node = data.nodes[nodeId];
      if (node.models && node.models[modelId] && node.models[modelId].model_state === 'DEPLOYED') {
        isDeployed = true;
        break;
      }
    }

    if (isDeployed) {
      console.log(`Model ${slug} (${modelId}) is already deployed`);
      return;
    }

    console.log(`Model ${slug} (${modelId}) is not deployed, deploying now...`);
    await axios.post(`http://opensearch:9200/_plugins/_ml/models/${modelId}/_deploy`);

    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await sleep(3);
      attempts++;
      try {
        const { data: statusData } = await axios.get(`http://opensearch:9200/_plugins/_ml/profile/models/${modelId}`);

        let deploymentComplete = false;
        for (const nodeId in statusData.nodes) {
          const node = statusData.nodes[nodeId];
          if (node.models && node.models[modelId] && node.models[modelId].model_state === 'DEPLOYED') {
            deploymentComplete = true;
            break;
          }
        }

        if (deploymentComplete) {
          console.log(`Model ${slug} (${modelId}) deployed successfully`);
          return;
        }
      } catch (error) {
        console.log(`Waiting for model deployment... (attempt ${attempts}/${maxAttempts})`);
      }
    }

    throw new Error(`Model ${slug} (${modelId}) failed to deploy within 3 minutes`);
  } catch (error: any) {
    console.error(`Error ensuring model ${slug} (${modelId}) is deployed:`, error.response?.data || error.message);
    throw error;
  }
}

async function loadModels(slugs: string[], env: Record<string, string>): Promise<Model[]> {
  return await Promise.all(slugs.map(async (slug) => {
    const filePath = path.join(__dirname, 'assets', slug + '.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Model file not found: ${slug}`);
    }

    let content = fs.readFileSync(filePath, 'utf8');
    for (const [key, value] of Object.entries(env)) {
      content = content.replace(new RegExp(key, 'gm'), value);
    }
    const model = JSON.parse(content) as ModelDefinition;

    const response = await axios.post('http://opensearch:9200/_plugins/_ml/models/_search', {
      query: {
        match: {
          name: {
            query: model.name,
            operator: 'and'
          }
        }
      }
    });

    let modelId = response.data.hits.hits[0]?._source.model_id;
    if (modelId) {
      await ensureModelIsDeployed(modelId, slug);
    } else {
      modelId = await deployModel(model);
    }
    console.log(`Model ${slug} deployed with ID: ${modelId}`);

    return {
      id: modelId,
      slug,
      definition: model
    } as Model;
  }))
}

async function deployModel(definition: ModelDefinition): Promise<string> {
  try {
    console.log('Deploying model ' + definition.name + ' ...')
    const response = await axios.post('http://opensearch:9200/_plugins/_ml/models/_register?deploy=true', definition)

    let i = 0
    let modelId: string | undefined;
    do {
      try {
        console.log(definition.name + ' is deploying, waiting for 3 seconds...');
        modelId = await getModelIdByTask(response.data.task_id)
        break;
      } catch (error) {
        await sleep(3);
      }
    } while (i++ < 60)

    if (!modelId) throw new Error('Model did not deploy within 3 minutes')

    return modelId;
  } catch (error: any) {
    console.error('Error deploying model:', error.response?.data || error);
    throw error;
  }
}

async function getModelIdByTask(taskId: string): Promise<string> {
  const task = (await axios.get("http://opensearch:9200/_plugins/_ml/tasks/" + taskId)).data

  if (task.state === "COMPLETED") {
    return task.model_id
  }

  throw new Error('not completed')
}

export { deployModel, loadModels };
