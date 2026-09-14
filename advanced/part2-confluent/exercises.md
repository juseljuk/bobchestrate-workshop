# Advanced Part 2 — Stretch Exercises

Work through these after completing the main lab. They're designed to push your understanding of event-driven AI patterns further.

---

## Exercise 1 — Detect LOW_STOCK Events in Flink SQL

Add a second Flink SQL `INSERT INTO` statement that fires on low absolute stock levels (not just velocity spikes), writing `anomalyType = 'LOW_STOCK'` alerts to the same output topic.

---

## Exercise 2 — Add a Store Manager Contact Tool

Create a `get_store_manager` Python tool, import it to wxO, add it to the agent, and update the agent instructions to include the manager's name in escalation notifications.

---

## Exercise 3 — Enforce CRITICAL Reorder in the Schema Validator

Extend `response_validator.py` with a business rule: if `urgencyLevel` is `CRITICAL`, then `reorderRecommendation.shouldReorder` must be `true`. Raise a `ValueError` if the rule is violated.

---

## Exercise 4 — Wire as a wxO Collaborator

Create a native wxO orchestrator agent that routes inventory alert questions to `Fashion_Inventory_Alert_Processor` as a collaborator. Test routing behaviour in the wxO chat UI.

---

## Exercise 5 (Hard) — Schema Registry Validation in the Consumer

Replace the local-file-based `JSONDeserializer` in `consume_velocity_alerts_with_agent.py` with a Schema Registry-backed deserializer that pulls schemas dynamically.

---

[← Back to Advanced Part 2](README.md)
