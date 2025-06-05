const { enqueueIngestion } = require('../services/queueServices');
const { store } = require('../store/memoryStore');
const { v4: uuidv4 } = require('uuid');

/**
 * Handles POST /ingest
 */
function ingestData(req, res) {
  const { ids, priority } = req.body;

  const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
  if (!Array.isArray(ids) || !validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const ingestionId = uuidv4();
  enqueueIngestion(ingestionId, ids, priority);
  return res.json({ ingestion_id: ingestionId });
}

/**
 * Handles GET /status/:ingestion_id
 */
function getStatus(req, res) {
  const ingestionId = req.params.ingestion_id;
  const status = store[ingestionId];

  if (!status) {
    return res.status(404).json({ error: 'Ingestion ID not found' });
  }

  return res.json(status);
}

module.exports = {
  ingestData,
  getStatus
};
