package com.cinevault.repository;

import com.cinevault.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    List<Booking> findByMovieIdAndDateAndTime(Long movieId, String date, String time);

    @Query("SELECT b FROM Booking b WHERE b.movie.id = :movieId AND b.date = :date AND b.time = :time AND b.status = 'CONFIRMED'")
    List<Booking> findConfirmedBookings(
        @Param("movieId") Long movieId,
        @Param("date") String date,
        @Param("time") String time
    );
}
