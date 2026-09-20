export type StackInfo = {
  backend: string;
  frontend: string;
  api: string;
};

export type HealthResponse = {
  status: string;
  service: string;
  environment: string;
  stack: StackInfo;
};
