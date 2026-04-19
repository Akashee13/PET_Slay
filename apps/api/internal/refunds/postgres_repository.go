package refunds

import "database/sql"

const upsertRefundDecisionSQL = `
INSERT INTO refund_decisions (id, order_id, buyer_id, decision_type, reason_code, admin_notes, status)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (id)
DO UPDATE SET decision_type = EXCLUDED.decision_type, reason_code = EXCLUDED.reason_code, admin_notes = EXCLUDED.admin_notes, status = EXCLUDED.status, updated_at = NOW()
RETURNING id, order_id, buyer_id, status, decision_type, reason_code, admin_notes`

const listRefundsByOrderSQL = `
SELECT id, order_id, buyer_id, status, decision_type, reason_code, admin_notes
FROM refund_decisions
WHERE order_id = $1 AND buyer_id = $2
ORDER BY updated_at DESC`

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) Update(id string, input UpdateDecisionInput) (*Decision, error) {
	decisionType := input.DecisionType
	if decisionType == "" {
		decisionType = "store_credit"
	}
	orderID := input.OrderID
	if orderID == "" {
		orderID = "order-001"
	}
	buyerID := input.BuyerID
	if buyerID == "" {
		buyerID = "buyer-dev-001"
	}

	var decision Decision
	err := r.db.QueryRow(upsertRefundDecisionSQL, id, orderID, buyerID, decisionType, input.ReasonCode, input.AdminNotes, input.Status).Scan(
		&decision.ID,
		&decision.OrderID,
		&decision.BuyerID,
		&decision.Status,
		&decision.DecisionType,
		&decision.ReasonCode,
		&decision.AdminNotes,
	)
	if err != nil {
		return nil, err
	}

	return &decision, nil
}

func (r *PostgresRepository) ListByOrder(orderID, buyerID string) ([]Decision, error) {
	rows, err := r.db.Query(listRefundsByOrderSQL, orderID, buyerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []Decision{}
	for rows.Next() {
		var decision Decision
		if err := rows.Scan(&decision.ID, &decision.OrderID, &decision.BuyerID, &decision.Status, &decision.DecisionType, &decision.ReasonCode, &decision.AdminNotes); err != nil {
			return nil, err
		}
		items = append(items, decision)
	}

	return items, rows.Err()
}
