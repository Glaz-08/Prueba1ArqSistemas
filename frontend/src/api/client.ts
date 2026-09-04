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

export async function getSalud(): Promise<HealthResponse> {
  const response = await fetch("/api/salud");

  if (!response.ok) {
    throw new Error("No fue posible conectar con la API");
  }

  return response.json();
}
