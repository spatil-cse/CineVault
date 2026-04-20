// ===== MovieRepository.java =====
package com.cinevault.repository;

import com.cinevault.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
    List<Movie> findByActiveTrue();
    List<Movie> findByGenreIgnoreCase(String genre);
    List<Movie> findByTitleContainingIgnoreCase(String keyword);
}
