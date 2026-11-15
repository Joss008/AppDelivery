package com.delivery.backend.service;

import com.delivery.backend.dto.ActualizarEmpresaRequest;
import com.delivery.backend.dto.CambiarEstadoRequest;
import com.delivery.backend.dto.EmpresaResponse;
import com.delivery.backend.dto.RegistroEmpresaRequest;
import com.delivery.backend.entity.Empresa;
import com.delivery.backend.entity.Rol;
import com.delivery.backend.entity.Usuario;
import com.delivery.backend.repository.EmpresaRepository;
import com.delivery.backend.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class EmpresaService {

    private static final String ROL_ADMIN = "ADMIN";
    private static final String ROL_EMPRESA = "EMPRESA";

    private final EmpresaRepository empresaRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolService rolService;
    private final PasswordEncoder passwordEncoder;

    public EmpresaService(EmpresaRepository empresaRepository,
                          UsuarioRepository usuarioRepository,
                          RolService rolService,
                          PasswordEncoder passwordEncoder) {
        this.empresaRepository = empresaRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolService = rolService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public EmpresaResponse registrar(RegistroEmpresaRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El correo ya está registrado");
        }

        Rol rol = rolService.buscarPorNombre(ROL_EMPRESA);

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario = usuarioRepository.save(usuario);

        Empresa empresa = new Empresa();
        empresa.setUsuario(usuario);
        empresa.setNombreComercial(request.getNombreComercial());
        empresa.setDireccion(request.getDireccion());
        empresa.setTelefono(request.getTelefono());
        empresa.setActivo(true);
        empresa = empresaRepository.save(empresa);

        return toResponse(empresa);
    }

    @Transactional(readOnly = true)
    public List<EmpresaResponse> listarEmpresas() {
        Usuario actual = usuarioActual();

        if (esAdmin(actual)) {
            return empresaRepository.findAll().stream()
                    .map(this::toResponse)
                    .toList();
        }

        return empresaRepository.findByUsuarioId(actual.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EmpresaResponse obtenerPorId(Long id) {
        Empresa empresa = cargarConPermisos(id);
        return toResponse(empresa);
    }

    @Transactional
    public EmpresaResponse actualizar(Long id, ActualizarEmpresaRequest request) {
        Empresa empresa = cargarConPermisos(id);

        empresa.setNombreComercial(request.nombreComercial());
        empresa.setDireccion(request.direccion());
        empresa.setTelefono(request.telefono());

        empresa = empresaRepository.save(empresa);
        return toResponse(empresa);
    }

    @Transactional
    public EmpresaResponse cambiarEstado(Long id, CambiarEstadoRequest request) {
        Usuario actual = usuarioActual();
        if (!esAdmin(actual)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo un administrador puede cambiar el estado de una empresa");
        }

        Empresa empresa = empresaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Empresa no encontrada"));

        empresa.setActivo(request.activo());
        empresa = empresaRepository.save(empresa);
        return toResponse(empresa);
    }

    @Transactional(readOnly = true)
    public Empresa buscarPorUsuario(Long usuarioId) {
        return empresaRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada"));
    }

    private Empresa cargarConPermisos(Long id) {
        Empresa empresa = empresaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Empresa no encontrada"));

        Usuario actual = usuarioActual();
        if (!esAdmin(actual)) {
            Usuario dueno = empresa.getUsuario();
            if (dueno == null || !dueno.getId().equals(actual.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No tienes permisos para acceder a esta empresa");
            }
        }

        return empresa;
    }

    private Usuario usuarioActual() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof Usuario usuario)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }

        return usuario;
    }

    private boolean esAdmin(Usuario usuario) {
        return usuario.getRol() != null
                && ROL_ADMIN.equals(usuario.getRol().getNombre());
    }

    private EmpresaResponse toResponse(Empresa empresa) {
        Usuario usuario = empresa.getUsuario();
        return new EmpresaResponse(
                empresa.getId(),
                usuario != null ? usuario.getNombre() : null,
                usuario != null ? usuario.getEmail() : null,
                empresa.getNombreComercial(),
                empresa.getDireccion(),
                empresa.getTelefono(),
                empresa.getActivo()
        );
    }
}
