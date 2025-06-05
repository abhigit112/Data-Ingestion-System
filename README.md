# Data Ingestion System

A priority-based batch ingestion system for processing IDs efficiently with real-time status tracking. Built with Node.js and Express, storing all data in-memory for simplicity, this system demonstrates core concepts of batch processing, queue management, and priority handling.

---

## Features

- **Batch Processing**: IDs are processed in batches of 3 for efficiency.
- **Priority Queue**: HIGH priority jobs are processed first, followed by MEDIUM and LOW.
- **Status Tracking**: Users can check processing status ('yet_to_start', 'triggered', 'completed') in real-time.
- **Mock External API**: Simulates a delay of 1 second per ID for processing.
- **Memory Storage**: No database dependency; all data stored in-memory.

---

## Architecture Overview

### File Structure

```
project-root/
├── server.js               # Main Express server setup
├── routes/                 # API routes
│   └── ingestionRoutes.js
├── controllers/            # Request handlers
│   └── ingestionControllers.js
├── services/               # Batch processing logic
│   └── queueServices.js
├── store/                  # In-memory storage
│   └── memoryStore.js
├── utils/                  # Priority enumeration
│   └── priorityEnum.js
└── test.js                 # Testing script
```

### Data Flow

1. User submits IDs with a priority via `POST /ingest`.
2. IDs are split into batches of 3.
3. Batches are enqueued into a priority queue.
4. A background processor runs every 5 seconds, processing one batch at a time.
5. Each ID processing is simulated with a 1-second delay.
6. Status updates are stored in memory and can be fetched via `GET /status/:ingestion_id`.

---

## API Endpoints

### 1. Submit IDs for Processing

**`POST /ingest`**

*Request Body*:
```json
{
  "ids": [1, 2, 3, 4, 5],
  "priority": "MEDIUM" // "HIGH", "MEDIUM", or "LOW"
}
```

*Response*:
```json
{
  "ingestion_id": "uuid-generated-id"
}
```

*Errors*:
- 400 Bad Request if invalid array or priority.

---

### 2. Check Processing Status

**`GET /status/:ingestion_id`**

*Response*:
```json
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
```

*Errors*:
- 404 if the ID does not exist.

---

## Processing Logic

### Priority Handling
- Batches are sorted by priority (`HIGH=1`, `MEDIUM=2`, `LOW=3`) using `priorityEnum.js`.
- Within the same priority, FIFO order is maintained based on creation time.

### Batch Workflow
- Submission creates an ingestion record with initial state.
- Batches are enqueued; processor runs every 5 seconds and processes one highest-priority batch.
- Processing simulates a 1-second delay per ID.
- Batches update their status as `'triggered'` and `'completed'`.
- Ingestion status updates accordingly — from `'yet_to_start'` to `'triggered'` to `'completed'`.

### Status Determination
```js
function updateIngestionStatus(ingestionId) {
  const batchStatuses = store[ingestionId].batches.map(b => b.status);
  if (batchStatuses.every(s => s === 'yet_to_start')) 
    return 'yet_to_start';
  if (batchStatuses.every(s => s === 'completed')) 
    return 'completed';
  return 'triggered';
}
```

---

## Priority Queue Mechanics

- Uses numeric weights from `priorityEnum.js`.

```js
{ HIGH: 1, MEDIUM: 2, LOW: 3 }
```

- Sorted by priority and FIFO within same priority:

```js
queue.sort((a, b) => {
  const p1 = PRIORITY[a.priority];
  const p2 = PRIORITY[b.priority];
  return p1 !== p2 ? p1 - p2 : a.createdAt - b.createdAt;
});
```

---

## Usage & Setup

### 1. Install Dependencies
```bash
npm init -y
npm install express axios body-parser uuid
```

### 2. Run the Server
```bash
node server.js
```
*Output:*  
`Server running at http://localhost:5000`

### 3. Run Tests
```bash
node test.js
```
*Sample Test:*  
Submitting jobs and checking statuses after processing.

---

## Testing Scenarios

| Scenario                         | Expected Behavior                                               |
|----------------------------------|-----------------------------------------------------------------|
| Submit HIGH before MEDIUM      | HIGH jobs process first (priority order)                        |
| Submit MEDIUM before HIGH      | HIGH jobs jump queue due to higher priority                     |
| Status during processing         | Some batches triggered, others not yet start                   |
| Status after completion          | All batches marked as `'completed'`                            |

---

## Additional Notes
- The system is ideal for lightweight, in-memory workflows.
- Can be extended with persistence (DB) and scaling features for production.

---

Hope this helps you showcase your project elegantly on GitHub! Would you like me to prepare this as a Markdown file for direct copy-paste?
