# Notification System Design

## Stage 1 – REST API Design
To manage notifications, we can expose the following APIs:

- POST /notifications → used to create a new notification  
- GET /notifications?userId=X&n=5 → fetch top N notifications for a user  
- PATCH /notifications/:id/read → mark a notification as read  
- DELETE /notifications/:id → remove a notification  

---

## Stage 2 – Database Schema
We can store notifications in a table like this:

Table: notifications  
- id (UUID, Primary Key)  
- userId (UUID, Foreign Key)  
- type (Placement, Result, Event)  
- message (Text)  
- isRead (Boolean, default false)  
- timestamp (Datetime)  

To improve performance, we add a composite index on:
(userId, isRead, timestamp DESC)

---

## Stage 3 – Why Queries Can Be Slow
If there are no indexes, the database has to scan the entire table for every query.  
This becomes slow when:
- filtering unread notifications  
- sorting by latest timestamp  

**Fix:**  
Adding a composite index on (userId, isRead, timestamp DESC) helps speed up both filtering and sorting.

---

## Stage 4 – Performance Improvements
To make the system more efficient:

- Cache frequently accessed results using Redis  
- Use pagination (limit/offset) instead of loading everything  
- Enable connection pooling for better DB performance  
- Move old or read notifications to an archive table  

---

## Stage 5 – Fixing Async Notification Issues
Currently, if notifications are sent synchronously, it can slow down the system.

**Better approach:**
- Use a message queue (like RabbitMQ or BullMQ)  
- The main system (producer) pushes tasks to the queue  
- A worker (consumer) processes notifications asynchronously  
- Add retry logic for failures  
- Use a dead-letter queue for messages that fail permanently  

---

## Stage 6 – Implementation
The implementation is available in:
notification_app_be/app.js  

**Logic followed:**
1. Fetch notifications from the external API  
2. Assign priority weights:  
   - Placement → highest priority  
   - Result → medium  
   - Event → lowest  
3. Sort notifications by priority (highest first)  
4. If priorities are equal, sort by latest timestamp  
5. Return the top N notifications  