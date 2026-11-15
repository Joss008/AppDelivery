package com.delivery.backend.service;

import com.delivery.backend.entity.Rol;
import com.delivery.backend.repository.RolRepository;
import org.springframework.stereotype.Service;

@Service
public class RolService {

    private final RolRepository rolRepository;

    public RolService(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    public Rol buscarPorNombre(String nombre) {
        return rolRepository.findByNombre(nombre)
                .orElseThrow(() ->
                        new RuntimeException("No existe el rol: " + nombre));
    }
}