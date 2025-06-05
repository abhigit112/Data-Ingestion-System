const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/ingestionRoutes');
const { startBatchProcessor } = require('./services/queueServices');

const app = express();
app.use(bodyParser.json());
app.use('/', routes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  startBatchProcessor(); // Start background batch processor
});
