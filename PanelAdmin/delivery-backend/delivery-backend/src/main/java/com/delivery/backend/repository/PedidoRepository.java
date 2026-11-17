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
            + "WHERE p.empresa.id = :empresaId ORDER BY p.id DESC")
    List<Pedido> findByEmpresaIdConRepartidor(@Param("empresaId") Long empresaId);

    @Query("SELECT p FROM Pedido p JOIN FETCH p.empresa LEFT JOIN FETCH p.repartidor "
            + "WHERE p.empresa.id = :empresaId "
            + "AND (p.repartidor.id = :repartidorId OR p.repartidor IS NULL) "
            + "ORDER BY p.id DESC")
    List<Pedido> findVisiblesParaRepartidor(
            @Param("empresaId") Long empresaId,
            @Param("repartidorId") Long repartidorId);

    @Query("SELECT p FROM Pedido p JOIN FETCH p.empresa JOIN FETCH p.repartidor "
            + "WHERE p.repartidor.id = :repartidorId "
            + "AND p.estado IN (com.delivery.backend.entity.EstadoPedido.ACEPTADO, "
            + "com.delivery.backend.entity.EstadoPedido.PREPARANDO, "
            + "com.delivery.backend.entity.EstadoPedido.LISTO, "
            + "com.delivery.backend.entity.EstadoPedido.EN_CAMINO) "
            + "ORDER BY p.id DESC")
    List<Pedido> findActivosPorRepartidor(@Param("repartidorId") Long repartidorId);
}
