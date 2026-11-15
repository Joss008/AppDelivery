package com.delivery.backend.controller;

import com.delivery.backend.dto.ActualizarRepartidorRequest;
import com.delivery.backend.dto.CambiarEstadoRepartidorRequest;
import com.delivery.backend.dto.CrearRepartidorRequest;
import com.delivery.backend.dto.RepartidorResponse;
import com.delivery.backend.service.RepartidorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/repartidores")
public class RepartidorController {

    private final RepartidorService repartidorService;

    public RepartidorController(RepartidorService repartidorService) {
        this.repartidorService = repartidorService;
    }

    @GetMapping
    public ResponseEntity<List<RepartidorResponse>> listar() {
        return ResponseEntity.ok(repartidorService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RepartidorResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(repartidorService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<RepartidorResponse> crear(
            @Valid @RequestBody CrearRepartidorRequest request) {
        RepartidorResponse response = repartidorService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RepartidorResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarRepartidorRequest request) {
        return ResponseEntity.ok(repartidorService.actualizar(id, request));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<RepartidorResponse> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoRepartidorRequest request) {
        return ResponseEntity.ok(repartidorService.cambiarEstado(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        repartidorService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
