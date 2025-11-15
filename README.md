
---

# **AI Document Summarizer**

An end-to-end full-stack application that allows users to upload documents (PDF, TXT, DOCX), automatically summarize them using AI models, and manage authentication through a secure backend. This project includes a **React + Vite frontend** and a **FastAPI backend**.

---

## 🚀 Features

* User Authentication (Login / Register)
* Upload documents (PDF, TXT, DOCX)
* AI-powered text summarization
* REST API (FastAPI)
* Modern UI (React + TailwindCSS)
* Docker support

---

## 🧱 Project Structure

```
AI_DOCUMENT_SUMMARIZER
│
├── FrontEnd/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── Backend/
│   ├── app/
│   ├── uploads/
│   ├── model_cache/
│   ├── requirements.txt
│   └── Dockerfile
│
└── README.md
```

---

## 🛠 Tech Stack

### Frontend

* React
* Vite
* TailwindCSS
* Axios

### Backend

* FastAPI
* SQLAlchemy
* JWT Auth
* HuggingFace Model

### Database

* PostgreSQL

### Deployment

* Docker

---

## ⚙️ Installation

### Clone the Repo

```bash
git clone https://github.com/Karthik-hr18/AI_DOCUMENT_SUMMARIZER.git
cd AI_DOCUMENT_SUMMARIZER
```

---

# 🖥️ Frontend Setup

```bash
cd FrontEnd
npm install
npm run dev
```

---

# 🐍 Backend Setup

```bash
cd Backend
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at: [http://localhost:8000](http://localhost:8000)
Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔑 Environment Variables

Create `Backend/.env`:

```
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://postgres:password@localhost/ai_summarizer_db
```

Create `FrontEnd/.env`:

```
VITE_API_URL=http://localhost:8000
```

---

## 📡 API Endpoints

### Auth

POST /auth/register
POST /auth/login

### Documents

POST /upload
POST /summarize
GET /history

---

## 🐳 Docker (Backend)

```bash
cd Backend
docker build -t ai-summarizer-backend .
docker run -p 8000:8000 ai-summarizer-backend
```

---

## 📸 Screenshots

<h3>Login Page</h3>
<img src="./screenshots/login_page.png" width="600"/>

<h3>Register Page</h3>
<img src="./screenshots/register_page.png" width="600"/>

<h3>Upload Page</h3>
<img src="./screenshots/upload_page.png" width="600"/>

<h3>Summary Result</h3>
<img src="./screenshots/summary_result.png" width="600"/>

<h3>Project Structure</h3>
<img src="./screenshots/project_structure.png" width="600"/>

---

## 🤝 Contributing

PRs and issues are welcome.

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---

