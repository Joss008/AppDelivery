package com.delivery.backend.security;

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

    public boolean esAdmin() {
        Usuario usuario = get();
        return usuario.getRol() != null
                && ROL_ADMIN.equals(usuario.getRol().getNombre());
    }
}
