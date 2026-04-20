-- ============================================
-- CineVault Database Setup
-- Run this script in MySQL before starting app
-- ============================================

CREATE DATABASE IF NOT EXISTS cinevault
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cinevault;

-- ============================================
-- TABLES (Hibernate auto-creates, but here
-- for reference and manual setup)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(150)        NOT NULL UNIQUE,
  password   VARCHAR(255)        NOT NULL,
  role       ENUM('USER','ADMIN') DEFAULT 'USER',
  created_at DATETIME            DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movies (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200)  NOT NULL,
  description  TEXT,
  genre        VARCHAR(80),
  duration     INT           COMMENT 'in minutes',
  rating       VARCHAR(10),
  language     VARCHAR(50)   DEFAULT 'English',
  director     VARCHAR(100),
  cast         TEXT,
  poster_url   VARCHAR(500),
  trailer_url  VARCHAR(500),
  release_date VARCHAR(20),
  ticket_price DECIMAL(10,2) DEFAULT 250.00,
  active       TINYINT(1)    DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bookings (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT        NOT NULL,
  movie_id     BIGINT        NOT NULL,
  show_date    VARCHAR(20)   NOT NULL,
  show_time    VARCHAR(20)   NOT NULL,
  seats        TEXT          NOT NULL   COMMENT 'comma-separated: A1,A2,B3',
  total_amount DECIMAL(10,2),
  status       ENUM('CONFIRMED','CANCELLED') DEFAULT 'CONFIRMED',
  booked_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

-- ============================================
-- SEED DATA — Sample Movies
-- ============================================

INSERT INTO movies (title, description, genre, duration, rating, language, director, ticket_price, active)
VALUES
  ('Interstellar Odyssey',
   'A team of astronauts travels through a wormhole near Saturn in search of a new habitable world for humanity.',
   'Sci-Fi', 169, '9.1', 'English', 'Christopher Nolan', 250.00, 1),

  ('The Crimson Cipher',
   'A retired spy is pulled back into action when a coded message from her past resurfaces.',
   'Thriller', 132, '8.4', 'English', 'David Fincher', 250.00, 1),

  ('Last Horizon',
   'An elite soldier must defuse a global threat before a rogue AI detonates hidden warheads.',
   'Action', 148, '8.7', 'English', 'Zack Snyder', 280.00, 1),

  ('Phantom Protocol',
   'A secret agent must go rogue and clear his organization''s name after they are implicated in bombings.',
   'Spy', 145, '8.2', 'English', 'Brad Bird', 250.00, 1),

  ('Velvet Underground',
   'A haunting drama about love, loss, and redemption set against 1970s New York City.',
   'Drama', 118, '8.9', 'English', 'Paul Thomas Anderson', 220.00, 1),

  ('Neon Eclipse',
   'Two strangers meet during a power outage in Tokyo and fall in love over one magical night.',
   'Romance', 106, '7.8', 'Japanese', 'Makoto Shinkai', 220.00, 1),

  ('Shadow Kingdom',
   'A dark fantasy epic where a young queen must unite warring kingdoms against an ancient evil.',
   'Fantasy', 155, '8.5', 'English', 'Peter Jackson', 280.00, 1),

  ('Storm Protocol',
   'When a devastating hurricane traps a city, one firefighter races against time to save thousands.',
   'Action', 127, '8.0', 'English', 'Michael Bay', 250.00, 1);

-- ============================================
-- SEED DATA — Admin User
-- Password: admin123 (BCrypt encoded)
-- ============================================
INSERT INTO users (name, email, password, role) VALUES
  ('Admin', 'admin@cinevault.com',
   '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBpwTpFbOqf9nW',
   'ADMIN');

-- Verify setup
SELECT 'Database setup complete!' AS status;
SELECT COUNT(*) AS movie_count FROM movies;
SELECT COUNT(*) AS user_count  FROM users;
