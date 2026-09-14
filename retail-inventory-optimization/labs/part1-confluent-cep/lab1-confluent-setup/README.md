# Lab 1: Confluent Cloud Setup

## Overview

In Lab 1, you will set up a real-time retail inventory velocity detection pipeline using Confluent Cloud. This lab walks you through creating a Kafka cluster, configuring topics with schemas, and deploying a Flink SQL query that detects inventory velocity spikes for fashion products.

This lab provides a complete walkthrough that results in:

- A Confluent Cloud environment with a running Kafka cluster
- Input and output topics with registered JSON schemas
- A Flink compute pool running a velocity anomaly detection query
- API keys for secure access to Kafka and Schema Registry

---

## Learning Objectives

By completing this lab, you will learn how to:

- Create and configure Confluent Cloud environments and Kafka clusters
- Design and register JSON schemas for streaming inventory data
- Set up Flink compute pools for stream processing
- Write Flink SQL queries to detect retail inventory velocity spikes
- Generate and manage API keys for Kafka and Schema Registry

---

## Prerequisites

Before starting Lab 1, ensure you have:

- A **Confluent Cloud account** - [Sign up for free trial](https://www.confluent.io/confluent-cloud/tryfree/)
- **VS Code** code editor installed
- Basic understanding of SQL (SELECT, WHERE, CASE clauses)
- Familiarity with JSON data structures

---

## Architecture Overview

This lab extends the Part 1 inventory velocity detection flow with an AI-powered inventory review step:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Confluent Cloud Platform                   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  INPUT: Fashion Inventory Event Stream                     │ │
│  │  Topic: fashion.inventory.events                           │ │
│  │  • Real-time sales from POS terminals                      │ │
│  │  • Warehouse inventory updates                             │ │
│  │  • E-commerce transactions                                 │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                       │
│                         ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PROCESSING: Flink SQL Velocity Detection Engine           │ │
│  │  • Analyzes inventory patterns in real-time                │ │
│  │  • Detects velocity spikes (sales acceleration)            │ │
│  │  • Calculates hours to stockout                            │ │
│  │  • Applies business rules (velocity ratio thresholds)      │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                       │
│                         ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  OUTPUT: Velocity Anomaly Alert Stream                     │ │
│  │  Topic: fashion.velocity.anomalies                         │ │
│  │  • High-urgency inventory alerts                           │ │
│  │  • Detailed context for action                             │ │
│  │  • Ready for downstream automation systems                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Lab Steps

## Step 1: Environment Setup

### 1.1 Create Confluent Cloud Environment

**What you'll do:** Set up a logical workspace for your retail inventory optimization project.

1. Sign in to [Confluent Cloud](https://confluent.cloud)
2. Click **"Environments"** in the left sidebar
3. Click **"Add environment"**
4. Name: `fashion-inventory-prod`
5. Click **"Create"**

✅ **Checkpoint:** You should see your new environment `fashion-inventory-prod` in the environments list.

---

### 1.2 Create Kafka Cluster

**What you'll do:** Provision a Kafka cluster to host your streaming inventory data.

1. Inside the `fashion-inventory-prod` environment, click **"Create cluster"**
2. Select **"Basic"** cluster type (sufficient for learning)
3. Choose your preferred cloud provider and region
4. Name: `fashion-inventory-cluster`
5. Click **"Launch cluster"**

⏱️ **Wait Time:** Cluster creation takes 5-10 minutes.

✅ **Checkpoint:** Cluster status shows **"Running"** with a green indicator.

---

### 1.3 Create API Keys

**What you'll do:** Generate authentication credentials for your applications.

##### Kafka API Key

1. Go to your **"Hamburger"** menu on top right corner  → click on **"API keys"**

   ![API keys](./images/api_key.png)

2. Click **"Create key"**

   ![Add API Key](./images/add_apikey.png)

3. Select **"My Account"** for api key and click **"Next"**

   ![Select Account for API Key](./images/select_account_for_apikey.png)

4. Select resource scope for API key → **"Kafka Cluster"**

5. Specify Kafka **"Cluster"** and **"Environment"** click **"Next**"

   ![Select Resource Kafka Group for API Key](./images/select_resource_kafka_group_for_apikey.png)

6. Add a name and description to help identify this API key in the future.
   Name & Description: `fashion-inventory-app`

7. Click **"Create Api Key"**

   ![Add Name and Description for Kafka Key](./images/add_name_discription_for_kafka_key.png)

8. **⚠️ IMPORTANT:** Download and save the key and secret (you can't retrieve them later)

##### Schema Registry API Key

1. Go to your **"Hamburger"** menu on top right corner → click on **"API keys"**

2. Click **"Create key"**

3. Select **"My Account"** for api key and click **"Next"**

4. Select resource scope for API key → **"Schema Registry"**

5. Specify **"Environment"** click **"Next"**

   ![Select Resource SR Group for API Key](./images/select_resource_sr_group_for_apikey.png)

6. Add a name and description to help identify this API key in the future.
   Name & Description: `fashion-inventory-schema`

7. Click **"Create Api Key"**

   ![Add Name and Description for SR Key](./images/add_name_and_discription_for_sr_key.png)

8. **⚠️ IMPORTANT:** Download and save the key and secret (you can't retrieve them later)

---

### 1.4 Get Connection Endpoints

**What you'll do:** Retrieve the connection URLs needed for your applications.

##### Get Kafka Bootstrap Server

1. Navigate to your **Environment**

2. Go to your **Cluster**

3. Copy the link under **"Bootstrap server"**

   Example: `pkc-xxxxx.us-east-1.aws.confluent.cloud:9092`

   ![Get Kafka Bootstrap](./images/get_kafka_bootstrap.png)


##### Get Schema Registry URL

1. Navigate to your **Environment**

2. Click on **"Schema Registry"**

3. Copy the link under **"Endpoints"**

   Example: `https://psrc-xxxxx.us-east-1.aws.confluent.cloud`

   ![Get SR URL](./images/get_sr_url.png)

✅ **Checkpoint:** You have saved 6 values:
- Kafka API Key
- Kafka API Secret
- Schema Registry API Key
- Schema Registry API Secret
- Kafka Bootstrap Server URL
- Schema Registry URL

> 💾 **Best Practice:** Store these credentials in a password manager or secure vault. Never commit them to version control.

---

## Step 2: Topic and Schema Setup

### 2.1 Create Inventory Event Topic and Register Schema

**What you'll do:** Create a topic to receive inventory events.

1. Go inside **Environment**

   ![Environment](./images/environment.png)

2. Select  **Cluster**
   
   ![Select Cluster](./images/select_cluster.png)

3. Click on **Topics**
   
   ![Click on Topics](./images/click_on_topics.png)

4. Click on  **"Add Topic"**
   
   ![Add Topic](./images/add_input_topic_4.png)

5. **Topic name:** `fashion.inventory.events`

6. **Partitions:** `1` (sufficient for learning)

7. Click **"Create with defaults"**

   ![Name Input Topic](./images/name_input_topic.png)

**Topic Configuration:**
- Retention: 7 days (default)
- Cleanup policy: delete (default)


Now let's Create a Data Contract


8. Select **"Add for topic message values"** 

9. Click **"Add Data Contract"**

   ![Add Data Contract](./images/add_data_contract.png)

10. **Subject:** `fashion.inventory.events-value`

   ![Name Data Contract](./images/name_data_contract_inventory.png)

11. **Schema type:** `JSON`

   ![Select JSON Schema](./images/select_json_schema_11.png)

12. **Schema:** Copy from [`fashion-inventory-event.schema.json`](../../../fashion-inventory-setup/schemas/fashion-inventory-event.schema.json)

> ⚠️ **Critical:** `eventTime` must be `"type": "integer"` (not string) for Flink compatibility.

13. Click **"Create"**

✅ **Checkpoint:** 

Topic `fashion.inventory.events` appears in your topics list.

Schema `fashion.inventory.events-value` shows version 1.


---

### 2.2 Create Output Topic and Register Velocity Alert Schema

**What you'll do:** Create a topic to store velocity anomaly alerts.

1. Click **"Create topic"**

2. **Topic name:** `fashion.velocity.anomalies`

3. **Partitions:** `1`

4. Click **"Create with defaults"**

   ![Add Output Topic](./images/name_output_topic.png)

Now let's Create a Data Contract

5. Select **"Add for topic message values"** 

6. Click **"Add Data Contract"**


7. **Subject:** `fashion.velocity.anomalies-value`

   ![Name Data Contract](./images/name_data_contract_for_velocity_alert_schema.png)

8. **Schema type:** `JSON`


9. **Schema:** Copy from [`velocity-anomaly-alert.schema.json`](../../../fashion-inventory-setup/schemas/velocity-anomaly-alert.schema.json)

10. Click **"Create"**

✅ **Checkpoint:** 

Topic `fashion.velocity.anomalies` appears in your topics list.

Schema `fashion.velocity.anomalies-value` shows version 1.

---

### 2.3 Create Agent Response Topic

**What you'll do:** Create a topic to store agent responses.

1. Click **"Create topic"**

2. **Topic name:** `fashion.agent.responses`

3. **Partitions:** `1`

4. Click **"Create with defaults"**

   ![Add Agent Topic](./images/name_agent_topic.png)

Now let's Create a Data Contract

5. Select **"Add for topic message values"** 

6. Click **"Add Data Contract"**


7. **Subject:** `fashion.agent.responses-value`

   ![Name Data Contract](./images/name_data_contract_for_agent_response.png)

8. **Schema type:** `JSON`


9. **Schema:** Copy from [`agent-response.schema.json`](../../../fashion-inventory-setup/schemas/agent-response.schema.json)

10. Click **"Create"**


✅ **Checkpoint:** 

Topic `fashion.agent.responses` appears in your topics list.

Schema `fashion.agent.responses-value` shows version 1.


---

## Step 3: Flink SQL Setup

### 3.1 Create Flink Compute Pool

**What you'll do:** Provision computing resources for stream processing.

1. In your environment, 

2. Click **"Flink"** 

![Click Flink](./images/click_flink.png)

3. Go to **"Compute pools"** tab

![Click Compute Pool](./images/click_compute_pool.png)

4. Click **"Create compute pool"**

5. **Name:** `fashion-velocity-pool`

6. **Region:** Same as your Kafka cluster

7. **Max CFUs:** `5` (sufficient for learning)

8. Click **"Create"**

⏱️ **Wait Time:** Pool creation takes 3-5 minutes.

✅ **Checkpoint:** Compute pool status shows **"Running"**.

---

### 3.2 Open Flink SQL Workspace

**What you'll do:** Access the SQL editor for writing queries.

1. In your environment, 

2. Click **"Flink"** 

3. Go to **"Compute pools"** tab

4. Select your compute pool: `fashion-velocity-pool`

5. Click **"Open SQL workspace"**

You should see:
- SQL editor in the center
- Catalog of topics on the left
- Query history on the right

---

### 3.3 Verify Topic Table

**What you'll do:** Confirm Flink can see your inventory topic.

Run this query in the SQL workspace:

```sql
DESCRIBE `fashion.inventory.events`;
```

**Expected Output:**
```
Column Name       Data Type
---------------------------------
key               VARBINARY
eventId           VARCHAR
eventType         VARCHAR
eventTime         BIGINT          ← INTEGER from schema
storeId           VARCHAR
productId         VARCHAR
sku               VARCHAR
size              VARCHAR
color             VARCHAR
category          VARCHAR
brand             VARCHAR
style             VARCHAR
quantityBefore    INT
quantityAfter     INT
quantityChange    INT
unitPrice         DOUBLE
```

> 💡 **Note:** `eventTime` appears as `BIGINT` (Flink's integer type). This is correct!

✅ **Checkpoint:** Table structure matches expected output.

---

### 3.4 Add Event Time Column

**What you'll do:** Convert the timestamp to a format Flink can use for time-based operations.

Run this query:

```sql
ALTER TABLE `fashion.inventory.events`
ADD `event_ts` AS TO_TIMESTAMP_LTZ(`eventTime`, 3);
```

**What this does:**
- Creates a computed column `event_ts`
- Converts `eventTime` (milliseconds) to TIMESTAMP
- `3` means milliseconds precision

**Verify:**
```sql
DESCRIBE `fashion.inventory.events`;
```

You should now see `event_ts` column with type `TIMESTAMP_LTZ(3)`.

✅ **Checkpoint:** `event_ts` column exists in table description.

---

### 3.5 Add Watermark

**What you'll do:** Configure how Flink handles late-arriving events.

**Why watermarks are important:**
Watermarks tell Flink when it's safe to process time-based operations (like our velocity detection windows). They handle the reality that events don't always arrive in perfect time order - network delays, system issues, or clock differences can cause events to arrive late. Without watermarks, Flink wouldn't know when to trigger time-based calculations.

**How it works in our inventory detection:**
- We set a 2-minute watermark tolerance
- If an inventory event arrives within 2 minutes of its event time, it's processed normally
- Events arriving more than 2 minutes late are dropped
- This ensures our velocity detection runs in near real-time while handling minor delays

Run this query:

```sql
ALTER TABLE `fashion.inventory.events`
MODIFY WATERMARK FOR `event_ts` AS `event_ts` - INTERVAL '2' MINUTE;
```

**What this does:**
- Defines watermark on `event_ts` column
- Allows events up to 2 minutes late
- Events more than 2 minutes late are dropped
- Enables time-based operations to work correctly

**Verify:**
```sql
SHOW CREATE TABLE `fashion.inventory.events`;
```

You should see the watermark definition in the output.

✅ **Checkpoint:** Watermark appears in table definition.

---

### 3.6 Create Velocity Detection Query

**What you'll do:** Implement the core inventory velocity detection logic as a streaming query.

**The Algorithm:**
1. Read retail inventory sale events
2. Detect significant quantity changes
3. Assign severity based on current quantity change
4. Estimate stockout risk from remaining stock
5. Generate alerts for downstream action

Copy and run this query from [`velocity_anomaly_detection.sql`](../../../fashion-inventory-setup/sql/velocity_anomaly_detection.sql).

Make sure the SQL workspace is set to **Streaming** mode before you run the statement:
1. In the Flink SQL workspace, locate the query execution mode control
2. Select **Streaming**
3. Then run the query

```sql
INSERT INTO `fashion.velocity.anomalies` (
    `key`,
    `alertId`,
    `anomalyType`,
    `severity`,
    `timestamp`,
    `storeId`,
    `productId`,
    `sku`,
    `size`,
    `color`,
    `category`,
    `brand`,
    `currentVelocity`,
    `baselineVelocity`,
    `velocityRatio`,
    `currentStock`,
    `hoursToStockout`,
    `estimatedValue`,
    `recommendation`
)
SELECT
    CAST(sku AS BYTES) AS key,
    CONCAT('ALERT-', CAST(UNIX_TIMESTAMP() AS STRING), '-', sku) as alertId,
    'VELOCITY_SPIKE' as anomalyType,
    CASE
        WHEN ABS(quantityChange) > 20 THEN 'CRITICAL'
        WHEN ABS(quantityChange) > 10 THEN 'HIGH'
        ELSE 'MEDIUM'
    END as severity,
    DATE_FORMAT(CURRENT_TIMESTAMP, 'yyyy-MM-dd''T''HH:mm:ss''Z''') AS `timestamp`,
    storeId,
    productId,
    sku,
    size,
    color,
    category,
    brand,
    CAST(ABS(quantityChange) AS DOUBLE) as currentVelocity,
    CAST(2.0 AS DOUBLE) as baselineVelocity,
    CAST(ABS(quantityChange) / 2.0 AS DOUBLE) as velocityRatio,
    quantityAfter as currentStock,
    CAST(quantityAfter / NULLIF(ABS(quantityChange), 0) AS INT) as hoursToStockout,
    CAST(quantityAfter * unitPrice AS DOUBLE) as estimatedValue,
    'IMMEDIATE_ACTION_REQUIRED' as recommendation
FROM `fashion.inventory.events`
WHERE eventType = 'SALE'
    AND ABS(quantityChange) >= 5;
```

**Understanding Key Parts:**

**Alert Trigger:**
```sql
WHERE eventType = 'SALE'
  AND ABS(quantityChange) >= 5
```
Only sale events with significant quantity change generate alerts.

**Severity Logic:**
```sql
CASE
    WHEN ABS(quantityChange) > 20 THEN 'CRITICAL'
    WHEN ABS(quantityChange) > 10 THEN 'HIGH'
    ELSE 'MEDIUM'
END
```
Larger quantity drops produce more urgent alerts.

**Velocity Ratio:**
```sql
ABS(quantityChange) / 2.0
```
Compares current sales movement with an assumed baseline of 2 units.

**Stockout Calculation:**
```sql
quantityAfter / NULLIF(ABS(quantityChange), 0)
```
Estimates hours until inventory runs out at current velocity.

Click **"Run"** to start the streaming query.

✅ **Checkpoint:** Query status shows **"Running"** in Flink statements list.

---

## Step 4: Verification

### 4.1 Check Flink Statement Status

1. Go to **"Flink"** → **"Running statements"**
2. Find your velocity detection query
3. Status should be **"Running"**
4. Check metrics:
   - Records in: 0 (no data sent yet)
   - Records out: 0 (no alerts detected yet)

✅ **Checkpoint:** Statement is running with no errors.

---

### 4.2 Verify Topics in UI

1. Go to **"Topics"**
2. Verify these topics exist:
   - `fashion.inventory.events`
   - `fashion.velocity.anomalies`
   - `fashion.agent.responses`
3. Click on each topic and check:
   - Partitions: 1
   - Messages: 0 (no data yet)
   - Schema: Registered

✅ **Checkpoint:** All topics show correct configuration.

---

### 4.3 Verify Schemas

1. Go to **"Schema Registry"** → **"Schemas"**
2. Verify these schemas exist:
   - `fashion.inventory.events-value` (version 1)
   - `fashion.velocity.anomalies-value` (version 1)
   - `fashion.agent.responses-value` (version 1)
3. Click on each schema and verify:
   - Type: JSON
   - Compatibility: BACKWARD (default)
   - No validation errors

✅ **Checkpoint:** All schemas are registered and valid.

---

## 🎉 Lab Complete!

### What You've Built

You now have a **production-ready inventory velocity detection system**:

✅ **Data Ingestion Layer**
- Topic: `fashion.inventory.events`
- Schema: Validates all incoming inventory events
- Ready to receive events from POS terminals, warehouses, and e-commerce

✅ **Processing Layer**
- Flink SQL query running 24/7
- Detects velocity spike patterns in real-time
- Processes thousands of inventory events per second

✅ **Alert Layer**
- Topic: `fashion.velocity.anomalies`
- Schema: Validates velocity alerts
- Ready for downstream consumers

✅ **Agent Response Layer**
- Topic: `fashion.agent.responses`
- Schema: Validates agent responses
- Ready to receive AI-powered inventory analysis results

### What Happens Next

When inventory events arrive:
1. **Validation:** Schema Registry validates format
2. **Ingestion:** Events land in `fashion.inventory.events` topic
3. **Processing:** Flink SQL continuously analyzes patterns
4. **Detection:** Velocity spike patterns trigger alerts
5. **Output:** Alerts written to `fashion.velocity.anomalies`
6. **Action:** Downstream systems consume alerts and take action
7. **AI Analysis:** WatsonX Orchestrate agents consume velocity alerts for intelligent review
8. **Response:** Agent decisions written to `fashion.agent.responses`
9. **Action:** Downstream systems consume agent responses and take action

---

## 🚀 What Happens After This Lab?

### Lab 2: Testing Inventory Velocity Scenarios
- Send realistic inventory event data
- Trigger various velocity spike patterns
- Analyze detection accuracy
- Tune thresholds for optimal performance

### Lab 3: WatsonX Orchestrate Integration
- Connect AI agents to velocity alerts
- Automate inventory decision workflows
- Generate reorder recommendations
- Create inventory management tickets

[Go to Lab 2 →](../lab2-testing-inventory-scenarios/README.md)

---

## 🔗 Resources

- [Confluent Cloud Documentation](https://docs.confluent.io/cloud/current/overview.html)
- [Flink SQL Reference](https://docs.confluent.io/cloud/current/flink/reference/overview.html)
- [Schema Registry Guide](https://docs.confluent.io/platform/current/schema-registry/index.html)
- [Complete Setup Guide](../../../fashion-inventory-setup/COMPLETE_SETUP_GUIDE.md)

---
