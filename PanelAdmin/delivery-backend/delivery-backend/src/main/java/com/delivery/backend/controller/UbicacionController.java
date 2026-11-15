package com.delivery.backend.controller;

import com.delivery.backend.dto.CrearUbicacionRequest;
import com.delivery.backend.dto.UbicacionResponse;
import com.delivery.backend.service.UbicacionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class UbicacionController {

    private final UbicacionService ubicacionService;

    public UbicacionController(UbicacionService ubicacionService) {
        this.ubicacionService = ubicacionService;
    }

    @PostMapping("/ubicaciones")
    public ResponseEntity<UbicacionResponse> crear(
            @Valid @RequestBody CrearUbicacionRequest request) {
        UbicacionResponse response = ubicacionService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/ubicaciones")
    public ResponseEntity<List<UbicacionResponse>> listar() {
        return ResponseEntity.ok(ubicacionService.listar());
    }

    @GetMapping("/pedidos/{id}/ubicaciones")
    public ResponseEntity<List<UbicacionResponse>> listarPorPedido(
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(ubicacionService.listarPorPedido(id));
    }

    @GetMapping("/repartidores/{repartidorId}/pedidos/{pedidoId}/ubicaciones")
    public ResponseEntity<List<UbicacionResponse>> listarPorRepartidorYPedido(
            @PathVariable Long repartidorId,
            @PathVariable Long pedidoId) {
        return ResponseEntity.ok(
                ubicacionService.listarPorRepartidorYPedido(repartidorId, pedidoId));
    }
}
