package com.delivery.backend.controller;

import com.delivery.backend.dto.ActualizarPedidoRequest;
import com.delivery.backend.dto.CambiarEstadoPedidoRequest;
import com.delivery.backend.dto.CrearPedidoRequest;
import com.delivery.backend.dto.PedidoHistorialResponse;
import com.delivery.backend.dto.PedidoResponse;
import com.delivery.backend.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @GetMapping
    public ResponseEntity<List<PedidoResponse>> listar() {
        return ResponseEntity.ok(pedidoService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<PedidoResponse> crear(
            @Valid @RequestBody CrearPedidoRequest request) {
        PedidoResponse response = pedidoService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PedidoResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarPedidoRequest request) {
        return ResponseEntity.ok(pedidoService.actualizar(id, request));
    }

    @PostMapping("/{id}/aceptar")
    public ResponseEntity<PedidoResponse> aceptar(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String observacion = body != null ? body.get("observacion") : null;
        return ResponseEntity.ok(pedidoService.aceptar(id, observacion));
    }

    @PostMapping("/{id}/rechazar")
    public ResponseEntity<PedidoResponse> rechazar(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String observacion = body != null ? body.get("observacion") : null;
        return ResponseEntity.ok(pedidoService.rechazar(id, observacion));
    }

    @PostMapping("/{id}/estado")
    public ResponseEntity<PedidoResponse> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoPedidoRequest request) {
        return ResponseEntity.ok(pedidoService.cambiarEstado(id, request));
    }

    @GetMapping("/{id}/historial")
    public ResponseEntity<List<PedidoHistorialResponse>> listarHistorial(
            @PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.listarHistorial(id));
    }
}
