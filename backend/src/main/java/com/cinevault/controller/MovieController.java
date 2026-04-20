package com.cinevault.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cinevault.model.Movie;
import com.cinevault.repository.MovieRepository;

@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = "*")
public class MovieController {

    @Autowired private MovieRepository movieRepository;

    // GET all active movies
    @GetMapping
    public List<Movie> getAllMovies() {
        return movieRepository.findByActiveTrue();
    }

    // GET single movie
    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovie(@PathVariable Long id) {
        return movieRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // GET movies by genre
    @GetMapping("/genre/{genre}")
    public List<Movie> getByGenre(@PathVariable String genre) {
        return movieRepository.findByGenreIgnoreCase(genre);
    }

    // GET search
    @GetMapping("/search")
    public List<Movie> search(@RequestParam String q) {
        return movieRepository.findByTitleContainingIgnoreCase(q);
    }

    // POST create movie (admin)
    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody Movie movie) {
        movie.setActive(true);
        Movie saved = movieRepository.save(movie);
        return ResponseEntity.status(201).body(saved);
    }

    // PUT update movie (admin)
    @PutMapping("/{id}")
    public ResponseEntity<Movie> updateMovie(@PathVariable Long id, @RequestBody Movie req) {
        return movieRepository.findById(id).map(movie -> {
            movie.setTitle(req.getTitle());
            movie.setDescription(req.getDescription());
            movie.setGenre(req.getGenre());
            movie.setDuration(req.getDuration());
            movie.setRating(req.getRating());
            movie.setLanguage(req.getLanguage());
            movie.setDirector(req.getDirector());
            movie.setCast(req.getCast());
            movie.setPosterUrl(req.getPosterUrl());
            movie.setTicketPrice(req.getTicketPrice());
            return ResponseEntity.ok(movieRepository.save(movie));
        }).orElse(ResponseEntity.notFound().build());
    }

// DELETE (deactivate)
@DeleteMapping("/{id}")
public ResponseEntity<?> deleteMovie(@PathVariable Long id) {
    return movieRepository.findById(id).map(m -> {
        m.setActive(false);
        movieRepository.save(m);
        return ResponseEntity.noContent().build();
    }).orElse(ResponseEntity.notFound().build());
}
}
