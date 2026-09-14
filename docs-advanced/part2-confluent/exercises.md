# Advanced Part 2 — Stretch Exercises

Work through these after completing the main lab. They're designed to push your understanding of event-driven AI patterns further.

---

## Exercise 1 — Detect LOW_STOCK Events in Flink SQL

The current Flink query only fires on `SALE` events. Extend it to also detect `LOW_STOCK` conditions — when `quantityAfter` drops below a threshold regardless of event type.

**Goal:** Add a second `INSERT INTO` statement to the Flink workspace that writes `LOW_STOCK` alerts with `anomalyType = 'LOW_STOCK'` to `fashion.velocity.anomalies`.

**Hints:**
- A separate `INSERT INTO ... SELECT ... WHERE quantityAfter < 20 AND eventType != 'SALE'` statement keeps the logic clean
- Set `severity` to `HIGH` when `quantityAfter < 10` and `MEDIUM` otherwise
- `velocityRatio` is not meaningful for LOW_STOCK — use `1.0` as a placeholder and set `recommendation = 'LOW_STOCK_REPLENISHMENT'`
- The existing `velocity-anomaly-alert.schema.json` already allows `anomalyType = 'LOW_STOCK'` (it's in the enum)
- Verify the new alerts flow through the Python consumer without code changes — the consumer processes any alert that passes schema validation

---

## Exercise 2 — Add a Store Manager Contact Tool

The agent's `notifications.notifyTeams` field lists team names but has no contact details. Add a third tool that returns the store manager's name and contact for a given store ID.

**Goal:** Create and import a `get_store_manager` Python tool, add it to the agent, and update the agent instructions to include the manager's name in `notifications` when `escalationRequired = true`.

**Hints:**
- The tool can use a hardcoded dictionary of `storeId → {name, email, phone}` — no CSV needed
- Add at least 3–4 store entries matching the IDs in `store_locations.csv` (e.g. `STORE-NYC-001`, `STORE-LA-001`)
- After importing the tool, ask Bob: `"Add the get_store_manager tool to the Fashion_Inventory_Alert_Processor agent"`
- Update the agent instructions to say: "When escalationRequired is true, call get_store_manager and include the manager name in the actionRationale"
- Test by running a CRITICAL alert and verifying the manager name appears in the response

---

## Exercise 3 — Enforce CRITICAL Reorder in the Schema Validator

Currently `response_validator.py` validates the agent response against the schema but doesn't enforce business rules. Add a post-schema check: if `agentDecision.urgencyLevel` is `CRITICAL`, then `reorderRecommendation.shouldReorder` must be `true`.

**Goal:** Extend [`response_validator.py`](../../retail-inventory-optimization/fashion-inventory-consumer/response_validator.py) with a business rule check that raises `ValueError` if a CRITICAL decision is missing or has `shouldReorder = false`.

**Hints:**

```python
def validate_business_rules(payload: dict) -> None:
    decision = payload.get("agentDecision", {})
    reorder = payload.get("reorderRecommendation", {})
    if decision.get("urgencyLevel") == "CRITICAL":
        if not reorder.get("shouldReorder", False):
            raise ValueError(
                "Business rule violation: CRITICAL urgency requires shouldReorder=true"
            )
```

- Call `validate_business_rules(payload)` after `Draft7Validator` in `validate_agent_response()`
- Test it: temporarily change the agent instructions to set `shouldReorder = false` on CRITICAL alerts and verify the consumer raises the error and does not commit the Kafka offset
- Think about the trade-off: strict validation catches bad agent behaviour but increases retry rate

---

## Exercise 4 — Wire as a wxO Collaborator

The inventory alert agent currently only runs as a batch processor (Python consumer → agent → Kafka). Make it available as a conversational collaborator so a store manager can also query it directly in the wxO chat UI.

**Goal:** Create a native wxO orchestrator agent that routes inventory questions to `Fashion_Inventory_Alert_Processor` as a collaborator.

**Hints:**
- Ask Bob: `"Create a native watsonx Orchestrate agent called retail_operations_agent that acts as a store operations assistant. It should route all inventory alert and velocity spike questions to the Fashion_Inventory_Alert_Processor collaborator. For all other questions it should answer directly."`
- The `description` field on `Fashion_Inventory_Alert_Processor` is critical for routing — the orchestrator uses it to decide when to delegate
- Test two interactions in the wxO chat:
  - `"What's the store schedule for Black Friday?"` → orchestrator answers directly
  - `"We have a velocity spike on SKU JACKET-001 — 25 units sold in the last hour, 75 remaining"` → routed to the inventory agent
- Observe how the routing decision is made and what role the collaborator `description` plays

---

## Exercise 5 (Hard) — Schema Registry Validation in the Consumer

The current Python consumer reads from `fashion.velocity.anomalies` using a local schema file for deserialization. Extend `consume_velocity_alerts_with_agent.py` to use **Confluent Schema Registry** for deserialization — pulling the schema dynamically rather than from a local file.

**Goal:** Replace the local-file-based `JSONDeserializer` with one backed by the Schema Registry client, so schema evolution in the registry is automatically picked up by the consumer.

**Hints:**
- The `confluent_kafka.schema_registry.json_schema.JSONDeserializer` already accepts a `SchemaRegistryClient` as its first argument when you omit the schema string
- Change the `build_value_deserializer()` function to create the client-backed form:
  ```python
  def build_value_deserializer(schema_registry_client: SchemaRegistryClient) -> JSONDeserializer:
      return JSONDeserializer(
          schema_str=None,
          schema_registry_client=schema_registry_client,
          from_dict=velocity_alert_from_dict,
      )
  ```
- Pass the already-constructed `_schema_registry_client` through to `build_value_deserializer()`
- Verify: delete the local `velocity-anomaly-alert.schema.json` reference from the code and confirm the consumer still works
- Consider: what happens if the Schema Registry is temporarily unreachable? How would you add a fallback?

---

[← Back to Part 2: Event-Driven AI Agents](README.md){ .md-button }
