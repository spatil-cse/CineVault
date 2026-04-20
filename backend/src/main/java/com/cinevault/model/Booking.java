package com.cinevault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @Column(name = "show_date", nullable = false)
    private String date;

    @Column(name = "show_time", nullable = false)
    private String time;

    @Column(name = "seats", nullable = false, columnDefinition = "TEXT")
    private String seats;

    @Column(name = "total_amount")
    private Double total;

    @Enumerated(EnumType.STRING)
    private Status status = Status.CONFIRMED;

    @Column(name = "booked_at")
    private LocalDateTime bookedAt = LocalDateTime.now();

    public enum Status { CONFIRMED, CANCELLED }

    @Transient
    public List<String> getSeatList() {
        if (seats == null || seats.isBlank()) return List.of();
        return List.of(seats.split(","));
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Movie getMovie() { return movie; }
    public void setMovie(Movie movie) { this.movie = movie; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getSeats() { return seats; }
    public void setSeats(String seats) { this.seats = seats; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDateTime getBookedAt() { return bookedAt; }
    public void setBookedAt(LocalDateTime bookedAt) { this.bookedAt = bookedAt; }
}