# B5-Remainder

A full-stack web application for managing recurring tasks and routines. Built with a focus on reliability and security, featuring a Python (FastAPI) backend and a React (Vite) frontend.

## 🚀 Key Features

*   **Recurring Task Management**: Support for daily, monthly, and specific weekday intervals.
*   **Secure Authentication**: Passwords hashed with `bcrypt` (8+ characters, special symbols required).
*   **Email 2FA**: Two-step verification using 6-digit PINs sent via SMTP (Gmail).
*   **Smart Scheduling**: Automated calculation of the next due date upon task completion.
*   **Dockerized Environment**: Fully containerized architecture for easy deployment.

## 🛠️ Technology Stack

*   **Backend**: FastAPI, SQLAlchemy (PostgreSQL ORM), Uvicorn.
*   **Frontend**: React (Vite), Tailwind CSS.
*   **Database**: PostgreSQL 15.
*   **DevOps**: Docker, Docker Compose.

## 📦 Getting Started

### Prerequisites

*   Docker and Docker Compose installed.
*   A Gmail account with an **App Password** generated (for 2FA).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/b5-remainder.git](https://github.com/your-username/b5-remainder.git)
    cd b5-remainder
    ```

2.  **Configure environment variables:**
    Create a `.env` file in the root directory and fill in your credentials:
    ```text
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=taskdb
    MAIL_USER=your_email@gmail.com
    MAIL_PASSWORD=your_app_password
    ```

3.  **Launch the application:**
    ```bash
    docker compose up -d --build
    ```

4.  **Access the app:**
    *   **Frontend**: `http://localhost:3000`
    *   **Backend API (Swagger UI)**: `http://localhost:8000/docs`

## 🛡️ Security & Reliability

*   **Rate Limiting**: Integrated timer on the backend to prevent OTP/Login spam.
*   **Service Health Checks**: Backend waits for the database to be fully initialized before starting.
*   **Persistence**: PostgreSQL data is stored in a Docker volume to prevent data loss during container restarts.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
