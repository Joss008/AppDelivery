package com.delivery.backend.repository;

import com.delivery.backend.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByEmpresaId(Long empresaId);

    Optional<Pedido> findByIdAndEmpresaId(Long id, Long empresaId);

    @Query("SELECT p FROM Pedido p JOIN FETCH p.empresa LEFT JOIN FETCH p.repartidor WHERE p.id = :id")
    Optional<Pedido> findByIdConEmpresaYRepartidor(@Param("id") Long id);

    @Query("SELECT p FROM Pedido p JOIN FETCH p.empresa LEFT JOIN FETCH p.repartidor ORDER BY p.id")
    List<Pedido> findAllConEmpresaYRepartidor();

    @Query("SELECT p FROM Pedido p JOIN FETCH p.empresa LEFT JOIN FETCH p.repartidor "
            + "WHERE p.empresa.id = :empresaId ORDER BY p.id")
    List<Pedido> findByEmpresaIdConRepartidor(@Param("empresaId") Long empresaId);
}
