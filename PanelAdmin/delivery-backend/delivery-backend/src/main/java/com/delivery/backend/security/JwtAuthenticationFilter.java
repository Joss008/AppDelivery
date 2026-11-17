package com.delivery.backend.security;

import com.delivery.backend.entity.EstadoRepartidor;
import com.delivery.backend.entity.Repartidor;
import com.delivery.backend.entity.Usuario;
import com.delivery.backend.repository.RepartidorRepository;
import com.delivery.backend.repository.UsuarioRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final RepartidorRepository repartidorRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UsuarioRepository usuarioRepository,
            RepartidorRepository repartidorRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.repartidorRepository = repartidorRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authorization = request.getHeader("Authorization");

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authorization.substring(7);
            Claims claims = jwtService.validarToken(token);
            String rolClaim = claims.get("rol", String.class);

            if ("REPARTIDOR".equals(rolClaim)) {
                Number repIdNum = claims.get("repartidorId", Number.class);
                Long repartidorId = repIdNum != null
                        ? repIdNum.longValue()
                        : extraerRepartidorIdDeSubject(claims.getSubject());

                if (repartidorId != null) {
                    Repartidor repartidor = repartidorRepository
                            .findByIdConEmpresa(repartidorId)
                            .orElse(null);

                    if (repartidor != null
                            && repartidor.getEstado() != EstadoRepartidor.INACTIVO) {
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        repartidor,
                                        null,
                                        List.of(new SimpleGrantedAuthority("ROLE_REPARTIDOR"))
                                );

                        SecurityContextHolder.getContext()
                                .setAuthentication(authentication);
                    }
                }
            } else {
                String email = claims.getSubject();

                Usuario usuario = usuarioRepository.findByEmail(email)
                        .orElse(null);

                if (usuario != null
                        && Boolean.TRUE.equals(usuario.getActivo())) {

                    String rol = usuario.getRol().getNombre();

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    usuario,
                                    null,
                                    List.of(new SimpleGrantedAuthority("ROLE_" + rol))
                            );

                    SecurityContextHolder.getContext()
                            .setAuthentication(authentication);
                }
            }

        } catch (Exception e) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private Long extraerRepartidorIdDeSubject(String subject) {
        if (subject != null && subject.startsWith("repartidor:")) {
            try {
                return Long.parseLong(subject.substring("repartidor:".length()));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
