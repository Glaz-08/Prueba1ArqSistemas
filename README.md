# Registro de Revisiones — Ley 21.827

Sistema web para la gestión de registros de revisión de pertenencias en establecimientos educacionales, conforme a la Ley 21.827.

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Backend | Python + FastAPI |
| Frontend | React + TypeScript (Vite) |
| API | REST |

## Estructura del repositorio

```
backend/     API REST en FastAPI
frontend/    Aplicación web en React + TypeScript
```

## Cómo ejecutar

### Backend con Docker (recomendado)

```bash
docker compose up --build backend
```

La API queda en [http://localhost:8000](http://localhost:8000) y la documentación en [http://localhost:8000/docs](http://localhost:8000/docs).

### Backend en local (sin Docker)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

### Frontend (puerto 5173)

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda en [http://localhost:5173](http://localhost:5173) y se comunica con la API a través de `/api`.

## Tests y cobertura

El backend exige un mínimo de **60%** de cobertura. Desde `backend/`:

```bash
pip install -r requirements-dev.txt
pytest
```

## Integración continua

El pipeline de GitHub Actions está en `.github/workflows/ci.yml`. En cada push y pull request ejecuta:

- tests del backend con cobertura mínima del 60%
- construcción y smoke test de la imagen Docker del backend
- build del frontend

## Alcance actual

Esta base deja backend, frontend, API REST, Docker y CI operativos. Las funcionalidades del MVP (registro de revisiones, consulta, documento imprimible y estadísticas) se implementarán en siguientes iteraciones.
