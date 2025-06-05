const express = require('express');
const { ingestData, getStatus } = require('../controllers/ingestionControllers');

const router = express.Router();

router.post('/ingest', ingestData);
router.get('/status/:ingestion_id', getStatus);

module.exports = router;
