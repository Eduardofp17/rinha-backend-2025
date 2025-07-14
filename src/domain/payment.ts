interface BasePayment {
  correlationId: string;
  amount: number;
}

interface IPayload {
  correlationId: string;
  amount: number;
  requestedAt: string;
}

interface IPayment extends BasePayment {
  processor: 'default' | 'fallback';
  createdAt: string;
}

interface PaymentRequest {
  Body: BasePayment
}

export type {BasePayment, IPayload, IPayment, PaymentRequest};