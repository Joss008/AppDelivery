package com.delivery.backend.repository;

import com.delivery.backend.entity.Repartidor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RepartidorRepository extends JpaRepository<Repartidor, Long> {

    List<Repartidor> findByEmpresaId(Long empresaId);

    Optional<Repartidor> findByIdAndEmpresaId(Long id, Long empresaId);

    boolean existsByEmpresaIdAndDni(Long empresaId, String dni);

    boolean existsByEmpresaIdAndDniAndIdNot(Long empresaId, String dni, Long id);

    @Query("SELECT r FROM Repartidor r JOIN FETCH r.empresa WHERE r.id = :id")
    Optional<Repartidor> findByIdConEmpresa(@Param("id") Long id);

    @Query("SELECT r FROM Repartidor r JOIN FETCH r.empresa ORDER BY r.id")
    List<Repartidor> findAllConEmpresa();

    @Query("SELECT r FROM Repartidor r JOIN FETCH r.empresa "
            + "WHERE r.dni = :identificador OR r.telefono = :identificador "
            + "ORDER BY r.id ASC")
    List<Repartidor> findByIdentificadorConEmpresa(@Param("identificador") String identificador);
}
