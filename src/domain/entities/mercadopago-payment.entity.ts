export interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  collector_id: number;
  client_id: string;
  payment_status: string;
}

export interface MercadoPagoPaymentItem {
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface MercadoPagoNotification {
  id: string;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: string;
  user_id: string;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

export interface MercadoPagoPaymentStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process';
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  date_created: string;
  date_approved?: string;
}
