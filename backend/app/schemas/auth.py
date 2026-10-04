from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=6, max_length=200)


class UsuarioOut(BaseModel):
    id: str
    nombre: str
    username: str
    rol: str
    cargo: str = ""

    model_config = {"from_attributes": True}


class UsuarioCreate(BaseModel):
    nombre: str = Field(min_length=3, max_length=200)
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=6, max_length=200)
    rol: str = Field(pattern="^(admin|funcionario)$")
    cargo: str = Field(default="", max_length=120)


class UsuarioUpdate(BaseModel):
    nombre: str = Field(min_length=3, max_length=200)
    username: str = Field(min_length=3, max_length=80)
    rol: str = Field(pattern="^(admin|funcionario)$")
    cargo: str = Field(default="", max_length=120)


class CambiarContrasenaIn(BaseModel):
    contrasena_actual: str = Field(min_length=6, max_length=200)
    contrasena_nueva: str = Field(min_length=6, max_length=200)


class ResetContrasenaIn(BaseModel):
    username: str = Field(min_length=3, max_length=80)


class ResetContrasenaConfirmIn(BaseModel):
    token: str
    contrasena_nueva: str = Field(min_length=6, max_length=200)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut
