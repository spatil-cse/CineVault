package com.cinevault.controller;

import com.cinevault.model.Booking;
import com.cinevault.model.Movie;
import com.cinevault.model.User;
import com.cinevault.repository.BookingRepository;
import com.cinevault.repository.MovieRepository;
import com.cinevault.repository.UserRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private MovieRepository   movieRepository;
    @Autowired private UserRepository    userRepository;

    // ---- Get booked seats for a showtime ----
    @GetMapping("/seats")
    public ResponseEntity<List<String>> getBookedSeats(
            @RequestParam Long movieId,
            @RequestParam String date,
            @RequestParam String time) {

        List<Booking> bookings = bookingRepository.findConfirmedBookings(movieId, date, time);
        List<String> seats = bookings.stream()
            .flatMap(b -> b.getSeatList().stream())
            .collect(Collectors.toList());
        return ResponseEntity.ok(seats);
    }

    // ---- Create a booking ----
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest req) {

        User user = userRepository.findById(req.getUserId())
            .orElse(null);
        if (user == null) return ResponseEntity.badRequest()
            .body(Map.of("message", "User not found"));

        Movie movie = movieRepository.findById(req.getMovieId())
            .orElse(null);
        if (movie == null) return ResponseEntity.badRequest()
            .body(Map.of("message", "Movie not found"));

        // Check for seat conflicts
        List<String> alreadyBooked = getBookedSeatsList(req.getMovieId(), req.getDate(), req.getTime());
        List<String> conflict = req.getSeats().stream()
            .filter(alreadyBooked::contains)
            .collect(Collectors.toList());

        if (!conflict.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Seats already booked: " + conflict));
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setMovie(movie);
        booking.setDate(req.getDate());
        booking.setTime(req.getTime());
        booking.setSeats(String.join(",", req.getSeats()));
        booking.setTotal(req.getTotal() != null ? req.getTotal()
            : req.getSeats().size() * movie.getTicketPrice());
        booking.setStatus(Booking.Status.CONFIRMED);

        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.status(201).body(buildBookingResponse(saved));
    }

    // ---- Get user's bookings ----
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getUserBookings(@PathVariable Long userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        List<Map<String, Object>> response = bookings.stream()
            .map(this::buildBookingResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // ---- Get single booking ----
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBooking(@PathVariable Long id) {
        return bookingRepository.findById(id)
            .map(b -> ResponseEntity.ok(buildBookingResponse(b)))
            .orElse(ResponseEntity.notFound().build());
    }

    // ---- Cancel booking ----
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        return bookingRepository.findById(id).map(b -> {
            b.setStatus(Booking.Status.CANCELLED);
            bookingRepository.save(b);
            return ResponseEntity.ok(Map.of("message", "Booking cancelled"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---- Admin: all bookings ----
    @GetMapping
    public List<Map<String, Object>> getAllBookings() {
        return bookingRepository.findAll().stream()
            .map(this::buildBookingResponse)
            .collect(Collectors.toList());
    }

    // ---- Helpers ----
    private List<String> getBookedSeatsList(Long movieId, String date, String time) {
        return bookingRepository.findConfirmedBookings(movieId, date, time).stream()
            .flatMap(b -> b.getSeatList().stream())
            .collect(Collectors.toList());
    }

    private Map<String, Object> buildBookingResponse(Booking b) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",         b.getId());
        map.put("movieTitle", b.getMovie() != null ? b.getMovie().getTitle() : null);
        map.put("movieId",    b.getMovie() != null ? b.getMovie().getId() : null);
        map.put("date",       b.getDate());
        map.put("time",       b.getTime());
        map.put("seats",      b.getSeatList());
        map.put("total",      b.getTotal());
        map.put("status",     b.getStatus());
        map.put("bookedAt",   b.getBookedAt());
        return map;
    }

    // ---- DTO ----
    @Data
    public static class BookingRequest {
    private Long userId;
    private Long movieId;
    private String date;
    private String time;
    private List<String> seats;
    private Double total;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public List<String> getSeats() { return seats; }
    public void setSeats(List<String> seats) { this.seats = seats; }
    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }
}
}
