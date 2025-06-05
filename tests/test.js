const axios = require('axios');

async function runTest() {
  const BASE_URL = 'http://localhost:5000';

  console.log('Submitting MEDIUM priority...');
  const res1 = await axios.post(`${BASE_URL}/ingest`, {
    ids: [1, 2, 3, 4, 5],
    priority: 'MEDIUM'
  });

  setTimeout(async () => {
    console.log('Submitting HIGH priority...');
    const res2 = await axios.post(`${BASE_URL}/ingest`, {
      ids: [6, 7, 8, 9],
      priority: 'HIGH'
    });

    const id1 = res1.data.ingestion_id;
    const id2 = res2.data.ingestion_id;

    console.log(`Checking status after 15 seconds...`);

    setTimeout(async () => {
      const status1 = await axios.get(`${BASE_URL}/status/${id1}`);
      const status2 = await axios.get(`${BASE_URL}/status/${id2}`);

      console.log('Status - MEDIUM:\n', JSON.stringify(status1.data, null, 2));
      console.log('Status - HIGH:\n', JSON.stringify(status2.data, null, 2));
    }, 15000);

  }, 4000); // Add high priority 4 seconds after medium
}

runTest();
