# Agent Catalog

This project is a web-based catalog for discovering and managing various agents. It provides a user-friendly interface to browse, view details, and interact with registered agents. The backend is built with FastAPI, and the frontend is a modern React application using Vite and Tailwind CSS.

## Project Structure

The repository is organized into three main parts:

- `frontend/`: Contains the React-based user interface.
- `backend/`: The FastAPI application that serves agent information.
- `sample-agents/`: Includes several example agents that can be registered with the catalog.

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have the following installed:

- Python 3.8+ and pip
- Node.js and npm
- Docker (optional, for containerized setup)

### Installation & Running

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/agent-catalog.git
    cd agent-catalog
    ```

2.  **Run the Sample Agents:**

    The sample agents need to be running to be discovered by the backend.

    ```bash
    cd sample-agents
    pip install -r requirements.txt
    python run_all_agents.py
    ```

    This will start the `calendar_agent`, `finance_agent`, and `task_agent` on different ports.

3.  **Run the Backend Server:**

    The backend server is responsible for aggregating agent information.

    ```bash
    cd ../backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
    ```

    The API will be available at `http://localhost:8000`.

4.  **Run the Frontend Application:**

    The frontend provides the user interface for the catalog.

    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

    The application will be accessible at `http://localhost:5173`.

## Usage

Once all services are running, open your web browser and navigate to `http://localhost:5173`. You will see a list of available agents. You can click on an agent to view more details.

## API Endpoints

The backend provides the following API endpoints:

- `GET /agents`: Returns a list of all registered agents.
- `GET /agents/{agent_id}`: Returns details for a specific agent by its ID.
- `GET /docs`: Provides Swagger UI for interactive API documentation.

---
