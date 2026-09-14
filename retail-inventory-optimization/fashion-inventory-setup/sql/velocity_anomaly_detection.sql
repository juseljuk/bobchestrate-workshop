-- Velocity Anomaly Detection Query
-- Detects when sales velocity exceeds threshold
-- Generates alerts for items at risk of stockout
-- Simplified version for append-only mode
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