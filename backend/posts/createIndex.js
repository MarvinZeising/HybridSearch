const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function createIndex() {
  try {
    const indexName = 'posts';
    const schemaPath = path.join(__dirname, 'schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    // Create index template with schema
    await axios.put(`http://opensearch:9200/_index_template/${indexName}`, schema);
    console.log(`Successfully created index template ${indexName}`);
  } catch (error) {
    console.error('Error creating OpenSearch index:', error.message, error.response.data);
    throw error;
  }
}

module.exports = createIndex;
