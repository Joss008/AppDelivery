package com.delivery.backend.repository;

import com.delivery.backend.entity.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmpresaRepository extends JpaRepository<Empresa, Long> {

    Optional<Empresa> findByUsuarioId(Long usuarioId);
}