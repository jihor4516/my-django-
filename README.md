# my-django-

Full-stack theatre rental platform built with Django and Next.js.

## Stack

- Django 4.2 backend
- Next.js 14 frontend
- SQLite database for local use

## Project structure

- `backend/` Django backend and API
- `frontend/` Next.js frontend
- `requirements.txt` Python dependencies

## Local run

Backend:

```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Notes

- Local environment files and runtime artifacts are excluded from Git.
- Use `email-settings.example.bat` as a template for email configuration.