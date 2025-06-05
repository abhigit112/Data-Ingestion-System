const store = {}; // key: ingestion_id, value: status object
const queue = []; // holds pending batches

module.exports = { store, queue };
