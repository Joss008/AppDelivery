
package com.delivery.backend.service;

import com.delivery.backend.dto.LoginRequest;
import com.delivery.backend.dto.LoginResponse;
import com.delivery.backend.dto.UsuarioResponse;
import com.delivery.backend.entity.Usuario;
import com.delivery.backend.repository.UsuarioRepository;
import com.delivery.backend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {

        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Credenciales inválidas"
                ));

        if (!Boolean.TRUE.equals(usuario.getActivo())
                || !passwordEncoder.matches(
                        request.password(),
                        usuario.getPasswordHash())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Credenciales inválidas"
            );
        }

        String token = jwtService.generarToken(usuario);

        return new LoginResponse(
                token,
                "Bearer",
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getRol().getNombre()
        );
    }

    public UsuarioResponse obtenerUsuarioActual() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof Usuario usuario)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "No autenticado"
            );
        }

        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRol().getNombre()
        );
    }
}
