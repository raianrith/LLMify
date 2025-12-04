# LLMify - AI Engine Optimization Platform

<div align="center">

![LLMify Logo](https://img.shields.io/badge/LLMify-AI%20Engine%20Optimization-8b5cf6?style=for-the-badge&logo=sparkles)

**The new ~~SEO~~ AEO starts here.**

Track your brand's visibility across AI platforms like ChatGPT, Gemini, Claude, and Perplexity.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🚀 Features

### Core Functionality
- **Multi-LLM Query Generator** - Run queries across OpenAI GPT-4, Google Gemini, and Perplexity simultaneously
- **Brand Visibility Tracking** - Monitor mention rates, positioning, and sentiment across AI responses
- **Competitor Analysis** - Head-to-head comparison with competitors
- **Gap Analysis** - Identify missed opportunities and critical visibility gaps
- **Time-Series Trends** - Track visibility changes over time with interactive charts
- **Citation Analysis** - Track which URLs and domains are cited in AI responses

### Multi-Tenant Architecture
- **Self-Service Signup** - New companies can onboard themselves with a guided wizard
- **Client Isolation** - Each company has their own data, users, and settings
- **Role-Based Access** - Admin and user roles per client
- **Brand Customization** - Dynamic primary color theming per client

### Authentication & Security
- **JWT Authentication** - Secure token-based auth
- **Google OAuth** - Single sign-on with Google accounts
- **Password Hashing** - Bcrypt password security
- **Session Management** - Automatic token refresh and logout

### Admin Portal (Superadmin)
- **Client Management** - View and manage all registered companies
- **User Overview** - See all users across the platform
- **API Usage Tracking** - Monitor LLM API costs per client
- **Activity Logs** - Audit trail of user actions

### Advanced Analytics
- **Branded vs Non-Branded Queries** - Filter analysis by query type
- **Brand Aliases** - Track multiple name variations (e.g., "Kaysun", "Kaysun Corp", "Kaysun Corporation")
- **Competitor Aliases** - Track competitor name variations
- **Position Analysis** - Track where brand appears (first third, middle, last third)
- **Sentiment Analysis** - NLP-powered context classification

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Modern async Python web framework |
| **SQLAlchemy** | Database ORM with async support |
| **PostgreSQL / SQLite** | Database (cloud or local) |
| **Pydantic** | Data validation and serialization |
| **JWT (python-jose)** | Token-based authentication |
| **NLTK** | Natural language processing |
| **httpx** | Async HTTP client for OAuth |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first styling |
| **Recharts** | Data visualization |
| **Lucide Icons** | Modern icon library |

### LLM Integrations
| Provider | Models Supported |
|----------|------------------|
| **OpenAI** | GPT-4o, GPT-4, GPT-3.5 Turbo |
| **Google** | Gemini 2.0 Flash, Gemini 1.5 Pro |
| **Perplexity** | Sonar, Sonar Pro |

### Cloud Services (Optional)
- **Supabase** - PostgreSQL database hosting
- **Google Cloud** - OAuth authentication

---

## 📦 Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/raianrith/LLMify.git
cd LLMify
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp env.example .env

# Edit .env with your API keys (see Configuration section)

# Seed the database
python seed_data.py

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend application |
| http://localhost:8000 | Backend API |
| http://localhost:8000/api/docs | Swagger API documentation |

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL=sqlite:///./llm_visibility.db
# For PostgreSQL: postgresql://user:password@host:5432/database

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# LLM API Keys
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
PERPLEXITY_API_KEY=pplx-...

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_REDIRECT_BASE_URL=http://localhost:3000
```

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create or select a project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. Select **Web application**
6. Add redirect URI: `http://localhost:3000/api/oauth/google/callback`
7. Copy credentials to `.env`

### Cloud Database Setup (Optional)

#### Supabase (Recommended)
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database** → **Connection string**
4. Copy the URI and update `DATABASE_URL` in `.env`

**Note:** If your password contains special characters like `@`, URL-encode them (e.g., `@` → `%40`)

---

## 👤 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| **Superadmin** | superadmin | admin123 |
| **Kaysun Admin** | kaysun_admin | kaysun123 |
| **Kaysun User** | kaysun_user | kaysun123 |
| **Weidert Admin** | weidert_admin | weidert123 |

---

## 📁 Project Structure

```
LLMify/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry
│   │   ├── config.py            # Settings & configuration
│   │   ├── database.py          # Database connection
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # Authentication utilities
│   │   ├── llm_service.py       # LLM API integrations
│   │   ├── logging_utils.py     # Activity & API logging
│   │   └── routers/
│   │       ├── auth.py          # Login, logout, user info
│   │       ├── oauth.py         # Google OAuth
│   │       ├── signup.py        # Self-service registration
│   │       ├── account.py       # Account management
│   │       ├── clients.py       # Client CRUD
│   │       ├── queries.py       # Query execution
│   │       ├── analysis.py      # Analytics endpoints
│   │       └── admin.py         # Admin portal APIs
│   ├── seed_data.py             # Database seeding script
│   ├── requirements.txt         # Python dependencies
│   └── env.example              # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/           # Login page with OAuth
│   │   │   ├── signup/          # Multi-step signup wizard
│   │   │   ├── oauth/callback/  # OAuth callback handler
│   │   │   ├── dashboard/       # Main application
│   │   │   │   ├── page.tsx           # Dashboard overview
│   │   │   │   ├── generator/         # Query generator
│   │   │   │   ├── analysis/          # Visibility analysis
│   │   │   │   ├── competitors/       # Competitor comparison
│   │   │   │   ├── gaps/              # Gap analysis
│   │   │   │   ├── trends/            # Time series charts
│   │   │   │   └── settings/          # Client settings
│   │   │   └── admin/           # Admin portal
│   │   │       ├── page.tsx           # Admin dashboard
│   │   │       ├── clients/           # Client management
│   │   │       ├── users/             # User management
│   │   │       ├── costs/             # API usage & costs
│   │   │       └── activity/          # Activity logs
│   │   ├── components/
│   │   │   └── DashboardLayout.tsx    # Shared layout
│   │   └── lib/
│   │       ├── api.ts           # API client functions
│   │       └── auth.tsx         # Auth context
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (form data) |
| POST | `/api/auth/login/json` | Login (JSON) |
| GET | `/api/auth/me` | Get current user |

### OAuth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oauth/config` | Check OAuth providers |
| GET | `/api/oauth/google/login` | Initiate Google OAuth |
| GET | `/api/oauth/google/callback` | Google OAuth callback |

### Signup
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup/` | Create new account |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients/current` | Get current client |
| PUT | `/api/clients/{id}` | Update client |
| GET | `/api/clients/{id}/competitors` | List competitors |
| POST | `/api/clients/{id}/competitors` | Add competitor |

### Queries
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/queries/run` | Run custom queries |
| POST | `/api/queries/run-predefined` | Run predefined queries |
| GET | `/api/queries/runs` | List query runs |
| GET | `/api/queries/runs/{id}` | Get run details |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analysis/runs/{id}/summary` | Analysis summary |
| GET | `/api/analysis/runs/{id}/gaps` | Gap analysis |
| GET | `/api/analysis/runs/{id}/competitors` | Competitor analysis |
| GET | `/api/analysis/runs/{id}/citations` | Citation analysis |
| GET | `/api/analysis/time-series` | Time series data |
| GET | `/api/analysis/dashboard-stats` | Dashboard stats |

### Admin (Superadmin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/clients` | All clients |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/api-usage` | API usage data |
| GET | `/api/admin/activity-logs` | Activity logs |

---

## 🎨 Customization

### Client Branding

Each client can customize:
- **Primary Color** - Applied to navigation, buttons, avatars
- **Brand Name** - Tracked in LLM responses
- **Brand Aliases** - Alternative names to track

Settings are available at **Dashboard** → **Settings** → **Client Settings**

### Adding a New Client (Programmatic)

```python
from app.database import SessionLocal
from app.models import Client, User
from app.auth import get_password_hash

db = SessionLocal()

client = Client(
    name="Acme Corp",
    slug="acme",
    brand_name="Acme",
    brand_aliases="Acme Inc, Acme Corporation",
    industry="Manufacturing",
    primary_color="#3b82f6"
)
db.add(client)
db.commit()

admin = User(
    email="admin@acme.com",
    username="acme_admin",
    hashed_password=get_password_hash("password123"),
    client_id=client.id,
    is_admin=True
)
db.add(admin)
db.commit()
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Switch to PostgreSQL database
- [ ] Generate secure `SECRET_KEY`
- [ ] Update CORS origins in `main.py`
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Configure proper logging
- [ ] Set up monitoring/alerting

### Docker Deployment

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db/llmify
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
      POSTGRES_DB: llmify
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 📄 License

Proprietary - All rights reserved.

---

## 🤝 Contributing

This is a private project. Contact the repository owner for contribution guidelines.

---

<div align="center">

**Built with ❤️ for the future of AI-powered search**

*The new AEO starts here.*

</div>
