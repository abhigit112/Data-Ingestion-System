Data Ingestion System
1. Overview
This project is a priority-based batch ingestion system that processes IDs in batches of 3. It allows users to submit jobs with different priorities (HIGH, MEDIUM, LOW) and provides real-time status tracking for each ingestion job.

Key Features
✅ Batch Processing – IDs are split into batches of 3 for efficient processing.
✅ Priority Queue – HIGH-priority jobs are processed before MEDIUM/LOW.
✅ Status Tracking – Users can check the status of each ingestion job (yet_to_start, triggered, completed).
✅ Mock External API – Simulates processing delays (1 second per ID).
✅ In-Memory Storage – No database dependency (stored in memoryStore.js).

2. System Architecture
2.1. File Structure
project-root/
├── server.js               # Main Express server setup  
├── routes/  
│   └── ingestionRoutes.js  # API endpoints  
├── controllers/  
│   └── ingestionControllers.js  # Request handlers  
├── services/  
│   └── queueServices.js    # Batch processing logic  
├── store/  
│   └── memoryStore.js      # In-memory data storage  
├── utils/  
│   └── priorityEnum.js     # Priority values (HIGH=1, MEDIUM=2, LOW=3)  
└── test.js                 # Test script  
├── package.json          # Project manifest
└── package-lock.json     # Auto-generated dependency lock

2.2. Data Flow
User submits IDs via POST /ingest with a priority (HIGH, MEDIUM, LOW).

System splits IDs into batches (max 3 per batch).

Batches are enqueued in a priority-sorted queue.

Background processor (startBatchProcessor) picks batches every 5 seconds.

Each ID is processed with a simulated 1-second delay.

Status updates are stored in memoryStore.

User checks status via GET /status/:ingestion_id.
3. API Endpoints
3.1. POST /ingest
Purpose: Submit a list of IDs for processing.

Request Body:

json
{
  "ids": [1, 2, 3, 4, 5],
  "priority": "MEDIUM"  // Must be "HIGH", "MEDIUM", or "LOW"
}
Response:

json
{
  "ingestion_id": "uuid-generated-id"
}
Error Cases:

400 Bad Request if ids is not an array or priority is invalid.

3.2. GET /status/:ingestion_id
Purpose: Check the status of an ingestion job.

Response:

json
{
  "ingestion_id": "uuid-generated-id",
  "status": "yet_to_start | triggered | completed",
  "batches": [
    {
      "batch_id": "uuid-generated-id",
      "ids": [1, 2, 3],
      "status": "triggered"
    }
  ]
}
Error Cases:

404 Not Found if ingestion_id does not exist.

4. Batch Processing Logic
4.1. Priority Handling
The queue is sorted by priority (HIGH > MEDIUM > LOW).

If two batches have the same priority, the older one (by createdAt) is processed first.

4.2. Batch Status Updates
yet_to_start → No batches processed yet.

triggered → At least one batch is processing.

completed → All batches are done.

4.3. Background Processing
Runs every 5 seconds (setInterval in queueServices.js).

Processes one batch at a time (FIFO within priority).

5. Setup & Execution
5.1. Installation
bash
npm init -y
npm install express axios body-parser uuid
5.2. Running the Server
bash
node server.js
Expected Output:

Server running at http://localhost:5000
5.3. Running the Test Script
bash
node test.js
Expected Output:

Submitting MEDIUM priority...
Submitting HIGH priority...
Checking status after 15 seconds...
Status - MEDIUM: { ... }
Status - HIGH: { ... }

6. Testing Scenarios
Test Case	Expected Behavior
Submit HIGH before MEDIUM	HIGH batches process first
Submit MEDIUM before HIGH	HIGH still jumps the queue
Check status mid-processing	Some batches triggered, others yet_to_start
Check status after completion	All batches completed

7. Core Processing Logic
7.1 Ingestion Flow
Request Submission (POST /ingest)

Validates input (array of IDs + valid priority)

Generates unique ingestion_id

Splits IDs into batches of 3

Stores initial state in memory

Queue Management

Batches are enqueued with:

js
{
  ingestionId,
  batchId,
  ids: [batch of 3],
  priority,
  createdAt: timestamp
}
Queue is sorted by:

Priority (HIGH=1 first)

Creation time (FIFO within same priority)

Batch Processing

Processor runs every 5 seconds

Takes highest priority batch

Simulates processing (1s per ID)

Updates statuses:

Individual batch status → "completed"

Overall ingestion status → recalculated

7.2 Status Determination
js
function updateIngestionStatus(ingestionId) {
  const batchStatuses = store[ingestionId].batches.map(b => b.status);
  
  if (batchStatuses.every(s => s === 'yet_to_start')) 
    return 'yet_to_start';
  if (batchStatuses.every(s => s === 'completed')) 
    return 'completed';
  return 'triggered'; // Mixed status
}

8. Priority Handling Mechanics
8.1 Priority Queue Implementation
Uses numeric weights from priorityEnum.js:

js
{ HIGH: 1, MEDIUM: 2, LOW: 3 }
Sorting logic:

js
queue.sort((a, b) => {
  const p1 = PRIORITY[a.priority];
  const p2 = PRIORITY[b.priority];
  return p1 !== p2 ? p1 - p2 : a.createdAt - b.createdAt;
});
8.2 Real-World Example
Time	Action	Queue State
T=0s	Submit MEDIUM [1,2,3,4,5]	[MEDIUM:1-3, MEDIUM:4-5]
T=4s	Submit HIGH [6,7,8,9]	[HIGH:6-8, HIGH:9, MEDIUM:1-3, MEDIUM:4-5]
T=5s	Processor runs	Processes HIGH:6-8
T=10s	Processor runs	Processes HIGH:9
T=15s	Processor runs	Processes MEDIUM:1-3

9. State Management
9.1 Memory Store Structure
js
// store object
{
  "ingestion_id_1": {
    ingestion_id: "id1",
    status: "triggered",
    batches: [
      { batch_id: "batch1", ids: [1,2,3], status: "completed" },
      { batch_id: "batch2", ids: [4,5], status: "triggered" }
    ]
  }
}

// queue array
[
  { ingestionId: "id1", batchId: "batch2", ... },
  { ingestionId: "id2", batchId: "batch3", ... }
]
9.2 State Transitions
Batch Status:
yet_to_start → triggered → completed

Ingestion Status:
yet_to_start → triggered → completed
            ↖───────↙
10. Performance Characteristics

10.1 Timing Analysis
Batch Interval: 5 seconds

Processing Time: 1 second per ID (3s per full batch)

Throughput:

~12 IDs/minute (1 batch/5s × 3 IDs)

Priority jumps can increase effective throughput for HIGH-priority jobs

10.2 Memory Considerations
All data stored in memory

Each ingestion stores:

UUID (ingestion_id + batch_ids)

Array of IDs (original + batches)

Multiple status fields

11. Conclusion
This system provides a simple yet effective way to manage priority-based batch processing.
It’s ideal for lightweight workflows but can be extended for production use with persistence and scalability improvements.
