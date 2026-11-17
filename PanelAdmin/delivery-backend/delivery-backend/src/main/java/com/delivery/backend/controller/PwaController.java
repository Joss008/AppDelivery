package com.delivery.backend.controller;

import com.delivery.backend.dto.PwaUbicacionRequest;
import com.delivery.backend.dto.RepartidorLoginRequest;
import com.delivery.backend.dto.RepartidorLoginResponse;
import com.delivery.backend.dto.RepartidorResponse;
import com.delivery.backend.service.PwaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class PwaController {

    private final PwaService pwaService;

    public PwaController(PwaService pwaService) {
        this.pwaService = pwaService;
    }

    @PostMapping({"/pwa/auth/login", "/auth/repartidor/login"})
    public ResponseEntity<RepartidorLoginResponse> login(
            @Valid @RequestBody RepartidorLoginRequest request) {
        return ResponseEntity.ok(pwaService.login(request));
    }

    @GetMapping("/pwa/auth/me")
    public ResponseEntity<RepartidorResponse> me() {
        return ResponseEntity.ok(pwaService.obtenerRepartidorActual());
    }

    @PostMapping("/pwa/auth/logout")
    public ResponseEntity<Map<String, Boolean>> logout() {
        pwaService.logout();
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/pwa/ubicaciones")
    public ResponseEntity<RepartidorResponse> registrarUbicacion(
            @Valid @RequestBody PwaUbicacionRequest request) {
        return ResponseEntity.ok(pwaService.registrarUbicacionPwa(request));
    }

    @DeleteMapping("/pwa/ubicaciones")
    public ResponseEntity<RepartidorResponse> pausarUbicacion() {
        return ResponseEntity.ok(pwaService.pausarUbicacionPwa());
    }
}
