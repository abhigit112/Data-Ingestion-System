const { store, queue } = require('../store/memoryStore');
const { v4: uuidv4 } = require('uuid');
const PRIORITY = require('../utils/priorityEnum');

function enqueueIngestion(ingestionId, ids, priority) {
  const batches = [];
  for (let i = 0; i < ids.length; i += 3) {
    const batchIds = ids.slice(i, i + 3);
    const batchId = uuidv4();
    batches.push({ batch_id: batchId, ids: batchIds, status: 'yet_to_start' });

    queue.push({
      ingestionId,
      batchId,
      ids: batchIds,
      priority,
      createdAt: Date.now()
    });
  }

  store[ingestionId] = {
    ingestion_id: ingestionId,
    status: 'yet_to_start',
    batches
  };

  queue.sort((a, b) => {
    const p1 = PRIORITY[a.priority];
    const p2 = PRIORITY[b.priority];
    return p1 !== p2 ? p1 - p2 : a.createdAt - b.createdAt;
  });
}

function updateIngestionStatus(ingestionId) {
  const batchStatuses = store[ingestionId].batches.map(b => b.status);
  if (batchStatuses.every(s => s === 'yet_to_start')) return 'yet_to_start';
  if (batchStatuses.every(s => s === 'completed')) return 'completed';
  return 'triggered';
}

async function processBatch(batch) {
  const { ingestionId, batchId, ids } = batch;
  const ingestion = store[ingestionId];
  const batchEntry = ingestion.batches.find(b => b.batch_id === batchId);

  batchEntry.status = 'triggered';
  ingestion.status = updateIngestionStatus(ingestionId);

  // Simulate async processing for each ID
  await Promise.all(ids.map(id => mockExternalAPI(id)));

  batchEntry.status = 'completed';
  ingestion.status = updateIngestionStatus(ingestionId);
}

function mockExternalAPI(id) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`Processed ID: ${id}`);
      resolve({ id, data: 'processed' });
    }, 1000); // mock delay
  });
}

function startBatchProcessor() {
  setInterval(async () => {
    if (queue.length > 0) {
      const batch = queue.shift();
      await processBatch(batch);
    }
  }, 5000); // 1 batch every 5 seconds
}

module.exports = { enqueueIngestion, startBatchProcessor };
