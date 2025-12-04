# LLM Search Visibility Tool - Full Stack Application

A multi-tenant full-stack application for tracking brand visibility across AI platforms (ChatGPT, Gemini, Perplexity). Built with FastAPI backend and Next.js frontend.

## Features

- **Multi-Client Support**: Each client (Kaysun, Weidert, etc.) has their own login and data
- **User Authentication**: JWT-based authentication with role-based access
- **Multi-LLM Query Generator**: Run queries across OpenAI, Gemini, and Perplexity
- **Search Visibility Analysis**: Track mention rates, positions, and sentiment
- **Competitor Comparison**: Head-to-head analysis with competitors
- **Gap Analysis**: Identify opportunities and critical gaps
- **Time-Series Dashboard**: Track visibility trends over time
- **Database Storage**: SQLite database (easily upgradeable to PostgreSQL)

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database (can upgrade to PostgreSQL)
- **JWT** - Authentication tokens
- **NLTK** - Natural language processing for sentiment analysis

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide Icons** - Beautiful icons

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### 1. Clone and Setup

```bash
cd fullstack-app
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp env.example .env

# Edit .env and add your API keys:
# OPENAI_API_KEY=your-openai-key
# GEMINI_API_KEY=your-gemini-key
# PERPLEXITY_API_KEY=your-perplexity-key

# Initialize database with seed data
python seed_data.py

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

### 5. OAuth Setup (Optional - Google Login)

To enable Google single sign-on:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure the consent screen if prompted
6. Select "Web application"
7. Add authorized redirect URI: `http://localhost:3000/api/oauth/google/callback`
8. Copy Client ID and Client Secret to your `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

⚠️ **Note**: OAuth login requires users to have an existing account with a matching email. Users signing in via OAuth for the first time will be redirected to the signup page.

### 6. Cloud Database Setup (Optional - PostgreSQL)

By default, the app uses SQLite (local file). For production or multi-user scenarios, use a cloud PostgreSQL database:

#### Option A: Supabase (Recommended - Free)
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database** → **Connection string** → **URI**
4. Update your `.env`:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
   ```

#### Option B: Neon (Serverless PostgreSQL)
1. Create account at [neon.tech](https://neon.tech)
2. Create a project
3. Copy the connection string to your `.env`

#### Option C: Railway
1. Create account at [railway.app](https://railway.app)
2. Add PostgreSQL plugin
3. Copy the `DATABASE_URL` to your `.env`

After updating the database URL, restart the backend and it will auto-create the tables.

### Default Login Credentials

| Client | Username | Password |
|--------|----------|----------|
| Admin | superadmin | admin123 |
| Kaysun | kaysun_admin | kaysun123 |
| Kaysun User | kaysun_user | kaysun123 |
| Weidert | weidert_admin | weidert123 |

## Project Structure

```
fullstack-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py         # Configuration settings
│   │   ├── database.py       # Database setup
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── auth.py           # Authentication utilities
│   │   ├── llm_service.py    # LLM API integrations
│   │   └── routers/
│   │       ├── auth.py       # Auth endpoints
│   │       ├── clients.py    # Client management
│   │       ├── queries.py    # Query execution
│   │       └── analysis.py   # Analysis endpoints
│   ├── seed_data.py          # Database seeding
│   ├── requirements.txt
│   └── env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Root redirect
│   │   │   ├── login/page.tsx        # Login page
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx        # Dashboard layout
│   │   │       ├── page.tsx          # Dashboard home
│   │   │       ├── generator/        # Query generator
│   │   │       ├── analysis/         # Visibility analysis
│   │   │       ├── competitors/      # Competitor comparison
│   │   │       ├── gaps/             # Gap analysis
│   │   │       ├── trends/           # Time-series dashboard
│   │   │       └── settings/         # Settings page
│   │   ├── components/
│   │   │   └── DashboardLayout.tsx   # Shared dashboard layout
│   │   └── lib/
│   │       ├── api.ts                # API client
│   │       └── auth.tsx              # Auth context
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with form data
- `POST /api/auth/login/json` - Login with JSON body
- `GET /api/auth/me` - Get current user info

### Clients
- `GET /api/clients/current` - Get current client
- `GET /api/clients/{id}/competitors` - List competitors
- `GET /api/clients/{id}/queries` - List predefined queries

### Queries
- `POST /api/queries/run` - Run custom queries
- `POST /api/queries/run-predefined` - Run predefined queries
- `GET /api/queries/runs` - List query runs
- `GET /api/queries/runs/{id}` - Get query run details
- `GET /api/queries/runs/{id}/status` - Get run status

### Analysis
- `GET /api/analysis/runs/{id}/summary` - Get analysis summary
- `GET /api/analysis/runs/{id}/gaps` - Get gap analysis
- `GET /api/analysis/runs/{id}/competitors` - Get competitor analysis
- `GET /api/analysis/time-series` - Get time-series data
- `GET /api/analysis/dashboard-stats` - Get dashboard statistics

## Configuration

### Environment Variables (Backend)

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL=sqlite:///./llm_visibility.db

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# LLM API Keys
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key
```

### Adding a New Client

1. Use the API or seed script to create a new client
2. Add competitors specific to that client
3. Add predefined queries relevant to their industry
4. Create user accounts for the client

Example using Python:

```python
from app.database import SessionLocal
from app.models import Client, User, Competitor
from app.auth import get_password_hash

db = SessionLocal()

# Create client
client = Client(
    name="New Company",
    slug="newcompany",
    brand_name="NewCo",
    industry="Technology",
    primary_color="#3b82f6"
)
db.add(client)
db.commit()

# Create admin user
admin = User(
    email="admin@newcompany.com",
    username="newco_admin",
    hashed_password=get_password_hash("password123"),
    client_id=client.id,
    is_admin=True
)
db.add(admin)
db.commit()
```

## Deployment

### Production Considerations

1. **Database**: Switch from SQLite to PostgreSQL for production
2. **Secret Key**: Generate a secure random secret key
3. **CORS**: Update allowed origins in `main.py`
4. **HTTPS**: Use HTTPS in production
5. **Rate Limiting**: Add rate limiting for API endpoints

### Docker Deployment (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db/llm_visibility
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: llm_visibility
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## License

Proprietary - Internal use only.

