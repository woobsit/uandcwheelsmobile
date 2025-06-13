// models/booking.model.ts
interface BookingAttributes {
  id: number;
  user_id: number;
  trip_id: number;
  seats: number[];
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: 'credit_card' | 'mobile_money' | 'bank_transfer';
  transaction_reference?: string;
}
// ...similar implementation