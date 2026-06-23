# 🚀 OfferForge

> **AI-Powered Technical Mock Interview & Evaluation Workspace**

OfferForge simulates realistic technical software engineering interviews, compiles user solutions against hidden test cases in a local compiler sandbox, evaluates code quality, and reviews step-by-step progress using deep timelines.

---

## 🎨 Visual Design & Theme

OfferForge uses a modern, **premium dark-graphite editorial style**:
* **Background:** Dark charcoal-graphite slate (`#0d0e10`).
* **Accents:** Vibrant electric indigo (`#6366f1`) and violet (`#a855f7`).
* **Interactions:** Glassmorphic layout panels, custom timeline items, and smooth slide/fade keyframe animations.

---

## 🏗️ Architecture Stack

OfferForge coordinates a full-stack dockerized environment:
1. **Frontend:** Next.js 15 (TypeScript, Tailwind CSS, Monaco Editor).
2. **Backend:** Java 21 (Spring Boot 3.3, JPA, Maven).
3. **Database:** PostgreSQL 16 (persists users, questions, sessions, submissions, and feedback).
4. **Cache:** Redis 7 (handles session details).
5. **Code execution:** Self-Hosted Judge0 CE (safely runs and grades candidate code local to the host).
6. **AI Orchestration:** NVIDIA NIM Cloud APIs (Llama 3.3 70B for dialogue/feedback, DeepSeek R1 for reviews, Nemotron for behaviors).

---

## 🔌 Port Mappings

Once active, the following services are exposed:
* **Frontend Web App:** `http://localhost:3000`
* **Spring Boot API Gateway:** `http://localhost:8080`
* **Local Judge0 Compiler Admin:** `http://localhost:2358/status`
* **PostgreSQL Main DB:** `localhost:5432`

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Docker** and **Docker Compose** installed on your system.

### 2. Launch the Application
All configuration, including the database profiles, caches, and the NVIDIA API Key, is defined in your root `.env` file. To download images and spin up the containers, run:

```bash
docker compose up --build -d
```

Verify that all containers are active:
```bash
docker compose ps
```

### 3. Usage Flow
1. Navigate to `http://localhost:3000`.
2. Click **Sign in with Google** or **Sign in with GitHub** (uses a free OAuth SSO mock endpoint).
3. From the dashboard, configure a mock round (e.g. **Oracle**, **DSA Round**) and click **Launch Interview**.
4. Discuss your strategy in the chat. You can toggle **Read Aloud** to have the interviewer speak using native browser text-to-speech.
5. Write code in the Monaco Editor (Java, Python, C++, Go, JS). Click **Run Code** to compile on the local Judge0 service.
6. Click **End Interview** to generate your AI Feedback Report and walk through your **Interview Replay** timeline.