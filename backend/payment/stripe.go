package payment

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/checkout/session"
	"time"
)

type StripeProcessor struct {
	apiKey      string
	successURL  string
	cancelURL   string
	frontendURL string
}

// NewStripeProcessor creates a new Stripe payment processor
func NewStripeProcessor(apiKey, frontendURL string) *StripeProcessor {
	if apiKey == "" {
		panic("empty Stripe API key")
	}
	stripe.Key = apiKey
	
	// Set up success and cancel URLs based on the frontend URL
	successURL := fmt.Sprintf("%s/payment/success", frontendURL)
	cancelURL := fmt.Sprintf("%s/payment/cancel", frontendURL)
	
	return &StripeProcessor{
		apiKey:      apiKey,
		successURL:  successURL,
		cancelURL:   cancelURL,
		frontendURL: frontendURL,
	}
}

// Order represents the order data needed for payment processing
type Order struct {
	ID              int         `json:"id"`
	UserID          int         `json:"user_id"`
	TotalAmount     float64     `json:"total_amount"`
	Status          string      `json:"status"`
	PaymentIntentID string      `json:"payment_intent_id,omitempty"`
	PaymentLink     string      `json:"payment_link,omitempty"`
	Items           []OrderItem `json:"items"`
}

// OrderItem represents an item in an order for payment processing
type OrderItem struct {
	ProductID       int     `json:"product_id"`
	Name            string  `json:"name"`
	Price           float64 `json:"price"`
	Quantity        int     `json:"quantity"`
	PriceAtPurchase float64 `json:"price_at_purchase"`
}

// CreatePaymentSession creates a new Stripe checkout session for an order
func (s *StripeProcessor) CreatePaymentSession(ctx context.Context, order *Order) (string, string, error) {
	// Create line items for the checkout session
	var lineItems []*stripe.CheckoutSessionLineItemParams
	
	// In a real application, you would create Stripe products and prices.
	// For this demo, we'll use one-time prices
	for _, item := range order.Items {
		lineItems = append(lineItems, &stripe.CheckoutSessionLineItemParams{
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				Currency: stripe.String("usd"),
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name: stripe.String(item.Name),
				},
				UnitAmount: stripe.Int64(int64(item.PriceAtPurchase * 100)), // Convert to cents
			},
			Quantity: stripe.Int64(int64(item.Quantity)),
		})
	}

	// Store order data in metadata
	marshalledItems, _ := json.Marshal(order.Items)
	metadata := map[string]string{
		"orderID":   fmt.Sprintf("%d", order.ID),
		"userID":    fmt.Sprintf("%d", order.UserID),
		"status":    order.Status,
		"items":     string(marshalledItems),
	}
	
	// Create the checkout session
	params := &stripe.CheckoutSessionParams{
		Metadata:    metadata,
		LineItems:   lineItems,
		Mode:        stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL:  stripe.String(fmt.Sprintf("%s?orderID=%d", s.successURL, order.ID)),
		CancelURL:   stripe.String(fmt.Sprintf("%s?orderID=%d", s.cancelURL, order.ID)),
	}
	
	// Create the session
	result, err := session.New(params)
	if err != nil {
		return "", "", err
	}
	
	return result.URL, result.ID, nil
}

// PaymentResult represents the complete result of a payment verification
type PaymentResult struct {
	Status        string    // 支付状态 (paid, unpaid, no_payment_required)
	Amount        int64     // 支付金额（以分为单位）
	Currency      string    // 货币类型 (usd, eur, etc)
	PaymentMethod string    // 支付方式 (card, alipay, etc)
	PaymentTime   time.Time // 支付时间
	TransactionID string    // 交易ID/付款意图ID
	CustomerEmail string    // 客户邮箱（如果可用）
	RawSession    *stripe.CheckoutSession // 原始会话数据供高级使用
}

// VerifyPaymentSession verifies a payment session and returns detailed payment information
func (s *StripeProcessor) VerifyPaymentSession(ctx context.Context, sessionID string) (*PaymentResult, error) {
	// 获取Stripe会话信息
	sess, err := session.Get(sessionID, &stripe.CheckoutSessionParams{
		Expand: []*string{
			stripe.String("payment_intent"),
			stripe.String("customer"),
			stripe.String("payment_intent.payment_method"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get session from Stripe: %w", err)
	}
	
	// 创建支付结果
	result := &PaymentResult{
		Status:     string(sess.PaymentStatus),
		Currency:   string(sess.Currency),
		RawSession: sess,
	}
	
	// 获取金额（从线条项目中计算或从支付意图中获取）
	if sess.AmountTotal > 0 {
		result.Amount = sess.AmountTotal
	}
	
	// 获取交易ID（通常为PaymentIntent ID）
	if sess.PaymentIntent != nil {
		result.TransactionID = sess.PaymentIntent.ID
		
		// 如果会话有支付意图，从中获取更多信息
		if sess.PaymentIntent.PaymentMethod != nil {
			result.PaymentMethod = string(sess.PaymentIntent.PaymentMethod.Type)
		}
		
		// 获取支付时间
		if sess.PaymentIntent.Created > 0 {
			result.PaymentTime = time.Unix(sess.PaymentIntent.Created, 0)
		}
	}
	
	// 获取客户邮箱
	if sess.Customer != nil && sess.Customer.Email != "" {
		result.CustomerEmail = sess.Customer.Email
	}
	
	return result, nil
}
