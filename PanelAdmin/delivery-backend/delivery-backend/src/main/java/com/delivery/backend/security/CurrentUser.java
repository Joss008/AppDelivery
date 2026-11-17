package com.delivery.backend.security;

import com.delivery.backend.entity.Repartidor;
import com.delivery.backend.entity.Usuario;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CurrentUser {

    private static final String ROL_ADMIN = "ADMIN";

    public Usuario get() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof Usuario usuario)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }

        return usuario;
    }

    public Repartidor getRepartidor() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof Repartidor repartidor)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado como repartidor");
        }

        return repartidor;
    }

    public boolean esRepartidor() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        return authentication != null
                && authentication.getPrincipal() instanceof Repartidor;
    }

    public boolean esAdmin() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        if (authentication == null
                || !(authentication.getPrincipal() instanceof Usuario usuario)) {
            return false;
        }
        return usuario.getRol() != null
                && ROL_ADMIN.equals(usuario.getRol().getNombre());
    }
}
