-- Add Stripe payment fields to orders table
ALTER TABLE `orders` 
ADD COLUMN `payment_intent_id` VARCHAR(255) NULL AFTER `payment_status`,
ADD COLUMN `payment_link` VARCHAR(255) NULL AFTER `payment_intent_id`;

-- Add index for payment_intent_id for faster lookups
CREATE INDEX idx_orders_payment_intent_id ON orders(payment_intent_id);
