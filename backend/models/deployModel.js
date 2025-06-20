import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

async function deployModel(fileName) {
  const model = JSON.parse(fs.readFileSync(path.join(__dirname, fileName), 'utf8'));
  console.log('Deploying model ' + model.name + ' ...')

  const response = await axios.post('http://opensearch:9200/_plugins/_ml/models/_register?deploy=true', model)

  let i = 0
  do {
    try {
      return await getModelIdByTask(response.data.task_id)
    } catch (error) {
      await sleep(3);
    }
  } while (i++ < 60)

  throw new Error('Model did not deploy within 3 minutes')
}

async function getModelIdByTask(taskId) {
  const task = (await axios.get("http://opensearch:9200/_plugins/_ml/tasks/" + taskId)).data
  if (task.state === "COMPLETED") {
    return task.model_id
  }
  throw new Error('not completed')
}

export default deployModel;
