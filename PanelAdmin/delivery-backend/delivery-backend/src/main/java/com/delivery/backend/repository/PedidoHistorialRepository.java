package com.delivery.backend.repository;

import com.delivery.backend.entity.PedidoHistorial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PedidoHistorialRepository extends JpaRepository<PedidoHistorial, Long> {

    @Query("SELECT h FROM PedidoHistorial h JOIN FETCH h.usuario "
            + "WHERE h.pedido.id = :pedidoId ORDER BY h.fecha ASC, h.id ASC")
    List<PedidoHistorial> findByPedidoIdConUsuario(@Param("pedidoId") Long pedidoId);
}
