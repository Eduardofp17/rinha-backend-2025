interface IHealthProcessor {
  failing: boolean;
  minResponseTime: number;
}

interface ICheckHealth {
  default: IHealthProcessor;
  fallback: IHealthProcessor;
}

export type {ICheckHealth, IHealthProcessor};