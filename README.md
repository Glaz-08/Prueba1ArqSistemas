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

Se necesitan dos terminales: una para el backend y otra para el frontend.

### Backend (puerto 8000)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Documentación interactiva de la API: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend (puerto 5173)

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda en [http://localhost:5173](http://localhost:5173) y se comunica con la API a través de `/api`.

## Alcance actual

Este commit deja el backend, el frontend y la API REST en funcionamiento como base del proyecto. Las funcionalidades del MVP (registro de revisiones, consulta, documento imprimible y estadísticas) se implementarán en siguientes iteraciones.
