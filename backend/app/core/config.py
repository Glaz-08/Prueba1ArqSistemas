from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Registro de Revisiones"
    app_env: str = "development"
    api_prefix: str = "/api"
    frontend_origin: str = "http://localhost:5173"
    database_url: str = "sqlite:///./data/app.db"
    upload_dir: str = "uploads"
    secret_key: str = "clave-desarrollo-cambiar-en-produccion"
    token_expire_minutos: int = 60 * 8

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
