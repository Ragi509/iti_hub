const db = require('../config/database');

/**
 * Business Rule 1: Automatically recalculates an item's current stock
 * current_stock = SUM(purchases) - SUM(issues) +/- SUM(adjustments)
 */
async function recalculateStock(itemId) {
  const result = await db.all(
    `SELECT type, SUM(quantity) as total_qty 
     FROM transactions 
     WHERE item_id = ? 
     GROUP BY type`,
    [itemId]
  );

  let purchases = 0;
  let issues = 0;
  let adjustments = 0;

  for (const row of result) {
    if (row.type === 'purchase') purchases += Number(row.total_qty || 0);
    else if (row.type === 'issue') issues += Number(row.total_qty || 0);
    else if (row.type === 'adjustment') adjustments += Number(row.total_qty || 0);
  }

  const calculatedStock = Math.max(0, purchases - issues + adjustments);

  await db.query(
    `UPDATE items SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [calculatedStock, itemId]
  );

  return calculatedStock;
}

/**
 * Business Rule 4: FIFO Stock Batch Allocation Calculator
 * Returns array of purchase batches to satisfy requested quantity
 */
async function calculateFifoBatches(itemId, requestedQty) {
  // Get all purchase transactions ordered by date ASC, id ASC
  const purchases = await db.all(
    `SELECT id, date, quantity, price, remarks, created_by 
     FROM transactions 
     WHERE item_id = ? AND type = 'purchase' 
     ORDER BY date ASC, id ASC`,
    [itemId]
  );

  // Get total issued quantity
  const issueRes = await db.get(
    `SELECT SUM(quantity) as total_issued 
     FROM transactions 
     WHERE item_id = ? AND type = 'issue'`,
    [itemId]
  );
  let remainingIssuedToConsume = Number(issueRes?.total_issued || 0);

  const batches = [];
  let neededQty = requestedQty;

  for (const p of purchases) {
    let purchaseQty = Number(p.quantity);
    
    // Consume issued stock against oldest purchase batches
    if (remainingIssuedToConsume > 0) {
      if (remainingIssuedToConsume >= purchaseQty) {
        remainingIssuedToConsume -= purchaseQty;
        continue; // batch fully consumed by past issues
      } else {
        purchaseQty -= remainingIssuedToConsume;
        remainingIssuedToConsume = 0;
      }
    }

    if (purchaseQty <= 0) continue;

    // Allocate from this batch
    const takeFromBatch = Math.min(purchaseQty, neededQty);
    batches.push({
      batch_transaction_id: p.id,
      purchase_date: p.date,
      unit_price: p.price,
      available_in_batch: purchaseQty,
      quantity_suggested: takeFromBatch,
      remarks: p.remarks
    });

    neededQty -= takeFromBatch;
    if (neededQty <= 0) break;
  }

  return {
    item_id: itemId,
    requested_quantity: requestedQty,
    allocated_quantity: requestedQty - neededQty,
    is_sufficient: neededQty <= 0,
    batches
  };
}

module.exports = {
  recalculateStock,
  calculateFifoBatches
};
