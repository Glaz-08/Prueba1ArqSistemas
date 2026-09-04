from pydantic import BaseModel


class StackInfo(BaseModel):
    backend: str
    frontend: str
    api: str


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str
    stack: StackInfo
