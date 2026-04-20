# 🎬 CineVault — Movie Ticket Booking System

A full-stack movie ticket booking web application with a cinematic dark-gold UI, Java Spring Boot REST API, and MySQL database.

---

## 📁 Project Structure

```
movie-booking/
├── index.html          ← Frontend HTML
├── style.css           ← Frontend CSS (dark luxury theme)
├── app.js              ← Frontend JavaScript (API calls + seat logic)
│
├── database/
│   └── schema.sql      ← MySQL setup script (tables + seed data)
│
└── backend/
    ├── pom.xml         ← Maven dependencies
    └── src/main/
        ├── resources/
        │   └── application.properties
        └── java/com/cinevault/
            ├── CineVaultApplication.java
            ├── model/
            │   ├── User.java
            │   ├── Movie.java
            │   └── Booking.java
            ├── repository/
            │   ├── UserRepository.java
            │   ├── MovieRepository.java
            │   └── BookingRepository.java
            ├── controller/
            │   ├── AuthController.java
            │   ├── MovieController.java
            │   └── BookingController.java
            ├── service/
            │   └── UserDetailsServiceImpl.java
            └── security/
                ├── JwtUtils.java
                └── SecurityConfig.java
```

---

## ⚙️ Prerequisites

| Tool | Version |
|------|---------|
| Java | 17+ |
| Maven | 3.8+ |
| MySQL | 8.0+ |
| Node / Live Server | Optional (for serving HTML) |

---

## 🗄️ Step 1 — MySQL Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run the schema script
source /path/to/movie-booking/database/schema.sql;
# OR
mysql -u root -p < database/schema.sql
```

This creates:
- `cinevault` database
- `users`, `movies`, `bookings` tables
- 8 sample movies
- 1 admin user (`admin@cinevault.com` / `admin123`)

---

## 🔧 Step 2 — Configure Backend

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/cinevault?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD

app.jwt.secret=cinevault_super_secret_key_change_in_production
```

---

## 🚀 Step 3 — Run the Backend

```bash
cd backend

# Build & run
mvn spring-boot:run

# OR build JAR first
mvn clean package -DskipTests
java -jar target/cinevault-backend-1.0.0.jar
```

Backend starts at: **http://localhost:8080**

---

## 🌐 Step 4 — Open the Frontend

**Option A — VS Code Live Server:**
Right-click `index.html` → "Open with Live Server"

**Option B — Python HTTP server:**
```bash
cd movie-booking
python3 -m http.server 5500
# Open http://localhost:5500
```

**Option C — Direct file:**
Just open `index.html` in your browser (demo mode works without backend)

---

## 🔌 REST API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT token |

### Movies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/movies` | Get all active movies |
| GET | `/api/movies/{id}` | Get single movie |
| GET | `/api/movies/genre/{genre}` | Filter by genre |
| GET | `/api/movies/search?q=` | Search by title |
| POST | `/api/movies` | Create movie (admin) |
| PUT | `/api/movies/{id}` | Update movie (admin) |
| DELETE | `/api/movies/{id}` | Deactivate movie (admin) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings/seats?movieId=&date=&time=` | Get booked seats |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings/user/{userId}` | User's booking history |
| GET | `/api/bookings/{id}` | Single booking |
| PUT | `/api/bookings/{id}/cancel` | Cancel booking |

---

## 📋 Sample API Requests

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"secret123"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123"}'
```

### Book Tickets (requires JWT)
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": 1,
    "movieId": 1,
    "date": "2025-08-15",
    "time": "07:30 PM",
    "seats": ["C4","C5","C6"],
    "total": 750
  }'
```

### Get Booked Seats
```bash
curl "http://localhost:8080/api/bookings/seats?movieId=1&date=2025-08-15&time=07:30%20PM"
```

---

## 🎭 Features

### Frontend
- 🎨 Cinematic dark-gold luxury theme
- 🎬 Movie grid with genre tags & ratings  
- 🗓️ Date picker (next 7 days)
- ⏰ Multiple showtimes per day
- 💺 Interactive 80-seat seat map (8 rows × 10 cols)
- 💳 Real-time price calculation
- 🔐 Login / Register modal with JWT auth
- 📋 My Bookings history
- 📱 Responsive mobile layout
- ✅ Demo mode (works without backend)

### Backend
- 🔒 JWT authentication & Spring Security
- 🎞️ Movie CRUD with search & filter
- 🎟️ Booking with seat conflict detection
- 👤 User management with BCrypt passwords
- 🌐 CORS configured for frontend
- 🗃️ MySQL with JPA/Hibernate ORM

---

## 🔐 Security Notes

- Passwords hashed with BCrypt (strength 10)
- JWT tokens expire in 24 hours
- Protected endpoints require `Authorization: Bearer <token>` header
- Change `app.jwt.secret` to a long random string in production
- Use HTTPS in production

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (custom), Vanilla JavaScript |
| Backend | Java 17, Spring Boot 3.2 |
| Security | Spring Security + JWT (jjwt) |
| Database | MySQL 8.0 |
| ORM | Spring Data JPA / Hibernate |
| Build | Apache Maven |

---

## 📝 License
MIT — free to use and modify.
