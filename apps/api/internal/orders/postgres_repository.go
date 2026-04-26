package orders

import (
	"database/sql"
	"encoding/json"
	"fmt"
)

const getOrderSQL = `
SELECT id, status, total_amount
FROM orders
WHERE id = $1`

const listOrdersSQL = `
SELECT id, status, total_amount
FROM orders
ORDER BY created_at DESC`

const listOrderItemsSQL = `
SELECT product_id, product_variant_id, quantity, unit_price, line_total
FROM order_items
WHERE order_id = $1
ORDER BY id`

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) Save(input CreateOrderRequest, order Order) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`
		INSERT INTO reseller_buyers (id, auth_user_id, status)
		VALUES ($1, $2, 'active')
		ON CONFLICT (auth_user_id) DO NOTHING
	`, input.BuyerID, input.BuyerID); err != nil {
		return err
	}

	shippingAddress, err := json.Marshal(input.ShippingAddress)
	if err != nil {
		return err
	}

	orderNumber := "PS-" + order.ID
	if _, err := tx.Exec(`
		INSERT INTO orders (id, buyer_id, order_number, status, subtotal_amount, total_amount, shipping_address, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
	`, order.ID, input.BuyerID, orderNumber, order.Status, order.TotalAmount, order.TotalAmount, string(shippingAddress), input.Notes); err != nil {
		return err
	}

	for index, item := range order.Items {
		itemID := fmt.Sprintf("%s-item-%03d", order.ID, index+1)
		if _, err := tx.Exec(`
			INSERT INTO order_items (id, order_id, product_id, product_variant_id, quantity, unit_price, line_total)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, itemID, order.ID, item.ProductID, item.VariantID, item.Quantity, item.UnitPrice, item.LineTotal); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *PostgresRepository) Get(orderID string) (*Order, error) {
	var order Order
	if err := r.db.QueryRow(getOrderSQL, orderID).Scan(&order.ID, &order.Status, &order.TotalAmount); err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrOrderNotFound
		}
		return nil, err
	}

	items, err := r.listItems(order.ID)
	if err != nil {
		return nil, err
	}
	order.Items = items
	applyRefundPolicy(&order)

	return &order, nil
}

func (r *PostgresRepository) List() ([]Order, error) {
	rows, err := r.db.Query(listOrdersSQL)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := []Order{}
	for rows.Next() {
		var order Order
		if err := rows.Scan(&order.ID, &order.Status, &order.TotalAmount); err != nil {
			return nil, err
		}
		items, err := r.listItems(order.ID)
		if err != nil {
			return nil, err
		}
		order.Items = items
		applyRefundPolicy(&order)
		orders = append(orders, order)
	}

	return orders, rows.Err()
}

func (r *PostgresRepository) UpdateStatus(orderID, status string) (*Order, error) {
	result, err := r.db.Exec(`
		UPDATE orders
		SET status = $2, updated_at = NOW()
		WHERE id = $1
	`, orderID, status)
	if err != nil {
		return nil, err
	}
	if rowsAffected, _ := result.RowsAffected(); rowsAffected == 0 {
		return nil, ErrOrderNotFound
	}

	return r.Get(orderID)
}

func (r *PostgresRepository) listItems(orderID string) ([]OrderLineItem, error) {
	rows, err := r.db.Query(listOrderItemsSQL, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []OrderLineItem{}
	for rows.Next() {
		var item OrderLineItem
		if err := rows.Scan(&item.ProductID, &item.VariantID, &item.Quantity, &item.UnitPrice, &item.LineTotal); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func applyRefundPolicy(order *Order) {
	order.RefundPolicy.DefaultMode = "store_credit"
	order.RefundPolicy.AdminExceptionAllowed = true
}
