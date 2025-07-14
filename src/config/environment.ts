export const ENVIRONMENT = {
  PAYMENT_PROCESSOR_URL_DEFAULT:  process.env.PROCESSOR_DEFAULT_URL ?? 'http://payment-processor-default:8080',
  PAYMENT_PROCESSOR_URL_FALLBACK: process.env.PROCESSOR_FALLBACK_URL ?? 'http://payment-processor-fallback:8080',
  APP_PORT: process.env.APP_PORT ?? 8080,
  REDIS_URL: process.env.REDIS_URL,
}