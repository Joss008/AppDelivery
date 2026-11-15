package com.delivery.backend.dto;

public class EmpresaResponse {

    private Long id;
    private String nombre;
    private String email;
    private String nombreComercial;
    private String direccion;
    private String telefono;
    private Boolean activo;

    public EmpresaResponse() {
    }

    public EmpresaResponse(Long id, String nombre, String email, String nombreComercial,
                           String direccion, String telefono, Boolean activo) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.nombreComercial = nombreComercial;
        this.direccion = direccion;
        this.telefono = telefono;
        this.activo = activo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNombreComercial() {
        return nombreComercial;
    }

    public void setNombreComercial(String nombreComercial) {
        this.nombreComercial = nombreComercial;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
