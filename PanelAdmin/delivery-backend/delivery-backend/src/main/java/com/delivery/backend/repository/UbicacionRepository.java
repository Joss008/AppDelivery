package com.delivery.backend.repository;

import com.delivery.backend.entity.Ubicacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UbicacionRepository extends JpaRepository<Ubicacion, Long> {

    @Query("SELECT u FROM Ubicacion u JOIN FETCH u.repartidor JOIN FETCH u.pedido "
            + "JOIN FETCH u.pedido.empresa ORDER BY u.fechaRegistro DESC, u.id DESC")
    List<Ubicacion> findAllConRelaciones();

    @Query("SELECT u FROM Ubicacion u JOIN FETCH u.repartidor JOIN FETCH u.pedido "
            + "JOIN FETCH u.pedido.empresa WHERE u.pedido.id = :pedidoId "
            + "ORDER BY u.fechaRegistro DESC, u.id DESC")
    List<Ubicacion> findByPedidoIdConRelaciones(@Param("pedidoId") Long pedidoId);

    @Query("SELECT u FROM Ubicacion u JOIN FETCH u.repartidor JOIN FETCH u.pedido "
            + "JOIN FETCH u.pedido.empresa WHERE u.pedido.empresa.id = :empresaId "
            + "ORDER BY u.fechaRegistro DESC, u.id DESC")
    List<Ubicacion> findByEmpresaIdConRelaciones(@Param("empresaId") Long empresaId);

    @Query("SELECT u FROM Ubicacion u JOIN FETCH u.repartidor JOIN FETCH u.pedido "
            + "WHERE u.repartidor.id = :repartidorId AND u.pedido.id = :pedidoId "
            + "ORDER BY u.fechaRegistro DESC")
    List<Ubicacion> findByRepartidorIdAndPedidoId(
            @Param("repartidorId") Long repartidorId,
            @Param("pedidoId") Long pedidoId);
}
