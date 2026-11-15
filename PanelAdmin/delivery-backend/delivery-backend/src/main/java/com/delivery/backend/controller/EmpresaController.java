package com.delivery.backend.controller;

import com.delivery.backend.dto.ActualizarEmpresaRequest;
import com.delivery.backend.dto.CambiarEstadoRequest;
import com.delivery.backend.dto.EmpresaResponse;
import com.delivery.backend.dto.RegistroEmpresaRequest;
import com.delivery.backend.service.EmpresaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/v1/empresas")
public class EmpresaController {

    private final EmpresaService empresaService;

    public EmpresaController(EmpresaService empresaService) {
        this.empresaService = empresaService;
    }

    @PostMapping
    public ResponseEntity<EmpresaResponse> registrar(
            @Valid @RequestBody RegistroEmpresaRequest request) {
        EmpresaResponse response = empresaService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<EmpresaResponse>> listar() {
        return ResponseEntity.ok(empresaService.listarEmpresas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmpresaResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(empresaService.obtenerPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmpresaResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEmpresaRequest request) {
        return ResponseEntity.ok(empresaService.actualizar(id, request));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<EmpresaResponse> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoRequest request) {
        return ResponseEntity.ok(empresaService.cambiarEstado(id, request));
    }
}
