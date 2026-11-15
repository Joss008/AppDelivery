# PROJECT.md — Sistema de Delivery

## 1. Descripción del proyecto

Desarrollar el backend de un sistema de gestión de delivery que permita administrar empresas, repartidores, pedidos, entregas y seguimiento de pedidos.

El sistema tendrá dos tipos de usuarios en esta etapa:

- **ADMIN:** administrador general de la plataforma.
- **EMPRESA:** usuario perteneciente a una empresa registrada que administra sus propios pedidos y operaciones.

El proyecto debe desarrollarse como un **monolito modular**, con una arquitectura organizada, segura, escalable y preparada para integrarse posteriormente con un frontend React y una PWA para repartidores.

## 2. Tecnologías obligatorias

- Java 21.
- Spring Boot 4.1.2.
- Maven.
- Spring Web MVC.
- Spring Data JPA.
- Spring Security.
- JWT para autenticación.
- PostgreSQL mediante Supabase.
- Flyway para migraciones SQL.
- Jakarta Validation.
- Lombok.
- Spring Boot DevTools.

Tecnologías previstas para futuras funcionalidades:

- Firebase Cloud Messaging para notificaciones.
- OpenStreetMap y Leaflet para mapas.
- Swagger / OpenAPI para documentación.

No incorporar tecnologías adicionales innecesarias sin justificar su utilidad.

## 3. Estado actual del proyecto

Ruta local:

`C:\Users\Jeff\Desktop\AppDelivery\PanelAdmin\delivery-backend\delivery-backend`

Paquete principal:

`com.delivery.backend`

El proyecto ya tiene implementados algunos componentes. Antes de modificar cualquier archivo, inspeccionar el código existente.

### Estructura actual esperada

```text
src/main/java/com/delivery/backend/
├── config/
│   ├── PasswordConfig.java
│   └── SecurityConfig.java
├── controller/
│   ├── AuthController.java
│   └── EmpresaController.java
├── dto/
│   ├── LoginRequest.java
│   ├── LoginResponse.java
│   ├── RegistroEmpresaRequest.java
│   └── EmpresaResponse.java
├── entity/
│   ├── Rol.java
│   ├── Usuario.java
│   └── Empresa.java
├── repository/
│   ├── RolRepository.java
│   ├── UsuarioRepository.java
│   └── EmpresaRepository.java
├── security/
│   ├── JwtService.java
│   └── JwtAuthenticationFilter.java
├── service/
│   ├── AuthService.java
│   ├── EmpresaService.java
│   ├── RolService.java
│   └── UsuarioService.java
└── DeliveryBackendApplication.java
```

### Base de datos existente

La conexión con Supabase PostgreSQL ya funciona.

La primera migración Flyway está creada:

`src/main/resources/db/migration/V1__crear_tablas_iniciales.sql`

Contiene:

- `roles`
- `usuarios`
- `empresas`

Los roles iniciales insertados son:

- ADMIN
- EMPRESA

**IMPORTANTE:** La migración V1 ya fue ejecutada. No modificarla ni eliminarla. Todas las modificaciones futuras de la base de datos deben realizarse mediante nuevas migraciones Flyway: V2, V3, V4, etc.

### Funcionalidades que ya se probaron

1. Conexión con Supabase PostgreSQL.
2. Registro de empresas mediante `POST /api/v1/empresas`.
3. Al registrar una empresa también se crea su usuario.
4. Contraseñas almacenadas mediante BCrypt.
5. Inicio de sesión mediante `POST /api/v1/auth/login`.
6. Generación de JWT con JJWT.
7. El login devuelve token, email, nombre y rol.
8. El servidor inicia correctamente en el puerto 8081.

### Problema pendiente

Se implementó `JwtAuthenticationFilter` y se modificó `SecurityConfig`, pero al probar las rutas protegidas en Postman se obtiene un error HTTP 403.

También aparece en los registros de inicio un mensaje de Spring Security indicando que se generó una contraseña temporal en memoria.

Investigar y corregir:

- Configuración de Spring Security.
- Registro y ejecución del filtro JWT.
- Autenticación en el SecurityContext.
- Gestión de errores para tokens inválidos o expirados.
- Configuración de sesiones stateless.
- Configuración de CORS para el futuro frontend React.
- Posibles conflictos con la configuración automática de Spring Security.

No solucionar el error simplemente haciendo públicas todas las rutas.

## 4. Arquitectura y responsabilidades

Mantener separación de responsabilidades:

- **Controller:** recibe peticiones HTTP y devuelve respuestas.
- **Service:** contiene las reglas de negocio.
- **Repository:** acceso a datos.
- **Entity:** representa las tablas de PostgreSQL.
- **DTO:** objetos de entrada y salida de la API.
- **Security:** autenticación, JWT y autorización.
- **Config:** configuración general.
- **Exception:** manejo centralizado de excepciones.

Evitar colocar lógica de negocio dentro de los controladores.

Utilizar inyección de dependencias mediante constructores.

Aplicar transacciones con `@Transactional` cuando corresponda.

## 5. Roles y permisos

### ADMIN

Tiene acceso global a la plataforma.

Puede:

- Registrar, listar, consultar, editar y desactivar empresas.
- Administrar usuarios.
- Registrar y administrar repartidores.
- Consultar todos los pedidos.
- Supervisar pedidos y entregas.
- Consultar ubicaciones.
- Administrar incidencias y reclamos.
- Consultar alertas de posibles fraudes.
- Consultar registros de auditoría.

### EMPRESA

Tiene acceso únicamente a los recursos de su propia empresa.

Puede:

- Consultar y actualizar su información.
- Consultar sus repartidores.
- Administrar sus pedidos.
- Asignar repartidores a sus pedidos.
- Consultar el estado de sus pedidos.
- Consultar el seguimiento de sus entregas.
- Gestionar incidencias relacionadas con sus pedidos.

**Regla crítica:** implementar aislamiento por empresa (multi-tenant). Una empresa nunca debe poder consultar, modificar o eliminar recursos pertenecientes a otra empresa, aunque conozca sus identificadores.

La validación debe realizarse en el backend, no solamente en el frontend.

### Roles fuera del alcance actual

No implementar todavía el rol REPARTIDOR como usuario autenticable.

El módulo de repartidores debe existir como entidad administrada por ADMIN y EMPRESA. La aplicación de repartidores se desarrollará posteriormente.

## 6. Módulos que debe completar

### Módulo 1: Autenticación y seguridad

Completar:

- Login con email y contraseña.
- Validación de usuario activo.
- Contraseñas con BCrypt.
- Generación de JWT.
- Validación de JWT.
- Expiración del token.
- Filtro JWT.
- Protección de endpoints.
- Autorización según roles.
- Endpoint para obtener el usuario autenticado.
- Cierre de sesión mediante estrategia compatible con JWT, si se implementa revocación de tokens.

Rutas:

```http
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

El login debe ser público. Las demás rutas deben exigir autenticación según corresponda.

No almacenar contraseñas ni devolver `passwordHash` en las respuestas.

### Módulo 2: Empresas

Implementar:

```http
GET    /api/v1/empresas
GET    /api/v1/empresas/{id}
POST   /api/v1/empresas
PUT    /api/v1/empresas/{id}
PATCH  /api/v1/empresas/{id}/estado
```

Permisos:

- ADMIN puede consultar y administrar todas las empresas.
- EMPRESA solamente puede consultar y actualizar su propia información.
- El registro público debe tener controles adecuados para evitar que cualquier persona pueda crear una cuenta ADMIN.

Mantener el registro de empresas existente.

### Módulo 3: Repartidores

Crear entidad, DTO, repository, service y controller.

Datos sugeridos:

- ID.
- Empresa asociada.
- Nombre completo.
- DNI.
- Teléfono.
- Estado.
- Fecha de registro.

Estados sugeridos:

- DISPONIBLE.
- OCUPADO.
- INACTIVO.

Rutas:

```http
GET    /api/v1/repartidores
GET    /api/v1/repartidores/{id}
POST   /api/v1/repartidores
PUT    /api/v1/repartidores/{id}
PATCH  /api/v1/repartidores/{id}/estado
DELETE /api/v1/repartidores/{id}
```

Aplicar aislamiento por empresa.

### Módulo 4: Pedidos

Crear entidad y relaciones necesarias.

Datos sugeridos:

- ID.
- Empresa.
- Repartidor asignado (opcional).
- Nombre del cliente.
- Teléfono del cliente.
- Dirección de entrega.
- Referencia de dirección.
- Descripción del pedido.
- Importe.
- Estado.
- Fecha de creación.
- Fecha de actualización.

Estados sugeridos:

- PENDIENTE.
- ACEPTADO.
- PREPARANDO.
- LISTO.
- EN_CAMINO.
- ENTREGADO.
- CANCELADO.
- RECHAZADO.

Rutas:

```http
GET  /api/v1/pedidos
GET  /api/v1/pedidos/{id}
POST /api/v1/pedidos
PUT  /api/v1/pedidos/{id}
POST /api/v1/pedidos/{id}/aceptar
POST /api/v1/pedidos/{id}/rechazar
POST /api/v1/pedidos/{id}/estado
```

Validar transiciones de estados para impedir operaciones inválidas.

No permitir asignar repartidores de otra empresa.

### Módulo 5: Seguimiento y ubicaciones

Crear estructura para almacenar las ubicaciones de los repartidores y asociarlas a los pedidos correspondientes.

Datos sugeridos:

- ID.
- Repartidor.
- Pedido.
- Latitud.
- Longitud.
- Fecha de registro.

Rutas:

```http
POST /api/v1/ubicaciones
GET  /api/v1/ubicaciones
GET  /api/v1/pedidos/{id}/ubicaciones
```

Validar coordenadas y permisos.

Preparar el diseño para integrar posteriormente Leaflet y OpenStreetMap.

### Módulo 6: Historial de pedidos

Registrar cada cambio de estado de un pedido.

Datos:

- Pedido.
- Estado anterior.
- Estado nuevo.
- Usuario que realizó el cambio.
- Fecha.
- Observación.

El historial debe permitir reconstruir la evolución de cada pedido.

### Módulo 7: Reclamos e incidencias

Preparar el módulo para:

- Registrar reclamos.
- Asociar reclamos a pedidos.
- Consultar reclamos.
- Cambiar el estado de atención.
- Registrar observaciones.

### Módulo 8: Alertas y auditoría

Preparar estructuras para:

- Alertas de posibles fraudes.
- Eventos sospechosos.
- Registro de acciones administrativas.
- Usuario responsable.
- Fecha y descripción del evento.

No implementar detección automática compleja sin requisitos concretos. Primero construir una estructura funcional y extensible.

## 7. Reglas de desarrollo

1. Analizar primero todos los archivos existentes.
2. No duplicar clases ni endpoints.
3. No eliminar funcionalidades que ya funcionan.
4. No cambiar innecesariamente las dependencias.
5. No modificar la migración V1.
6. Crear migraciones Flyway nuevas para los cambios de base de datos.
7. No usar `ddl-auto: update` para modificar el esquema.
8. Mantener PostgreSQL y Supabase.
9. No exponer credenciales ni secretos.
10. No incluir claves privadas en el repositorio.
11. Mantener JWT y contraseñas fuera de las respuestas públicas.
12. Utilizar DTOs para evitar exponer entidades directamente.
13. Validar los datos de entrada.
14. Manejar correctamente errores HTTP.
15. Evitar respuestas con trazas internas en producción.
16. Documentar endpoints y permisos.
17. Mantener compatibilidad con Java 21 y Spring Boot 4.1.2.
18. No implementar microservicios.

## 8. Variables de entorno

La configuración debe utilizar variables de entorno.

Variables previstas:

```env
SUPABASE_DB_URL=
SUPABASE_DB_USERNAME=
SUPABASE_DB_PASSWORD=
JWT_SECRET=
```

No escribir valores reales en el código ni en archivos versionados.

La aplicación utiliza `application.yml` para leer estas variables.

Spring Boot no carga automáticamente archivos `.env`. No asumir que lo hace. Configurar las variables mediante el entorno de ejecución o una solución explícita y segura.

El archivo `.env` debe permanecer excluido de Git.

## 9. Manejo de errores

Implementar un manejador global de excepciones con `@RestControllerAdvice`.

Utilizar códigos HTTP apropiados:

- 200: operación exitosa.
- 201: recurso creado.
- 400: datos inválidos.
- 401: falta autenticación o credenciales incorrectas.
- 403: usuario autenticado sin permisos suficientes.
- 404: recurso inexistente.
- 409: conflicto de datos.
- 500: error interno.

Las respuestas de error deben tener un formato consistente.

No devolver trazas internas, contraseñas, tokens ni información sensible.

## 10. Pruebas obligatorias

Crear pruebas para los principales servicios y endpoints.

Comprobar al menos:

### Autenticación

- Login correcto.
- Login con contraseña incorrecta.
- Login con email inexistente.
- Login con usuario inactivo.
- Token válido.
- Token expirado.
- Token inválido.
- Petición sin token.

### Autorización

- ADMIN puede acceder a recursos globales.
- EMPRESA puede acceder a sus propios recursos.
- EMPRESA no puede consultar recursos de otra empresa.
- EMPRESA no puede modificar recursos de otra empresa.
- Los endpoints privados rechazan peticiones sin autenticación.

### Negocio

- Registro de empresa.
- Validación de email duplicado.
- Registro de repartidor.
- Creación de pedido.
- Asignación de repartidor.
- Cambio de estado.
- Validación de transiciones.
- Registro de historial.

No considerar terminado un módulo solamente porque compila.

## 11. Documentación de API

Incorporar Swagger / OpenAPI cuando la seguridad y los endpoints principales estén funcionando.

Documentar:

- Descripción.
- Método HTTP.
- Ruta.
- Parámetros.
- DTO de entrada.
- Respuesta.
- Códigos de error.
- Rol autorizado.
- Necesidad de JWT.

Configurar el esquema Bearer JWT para probar endpoints protegidos desde Swagger.

## 12. Orden de trabajo obligatorio

Trabajar en este orden:

**Fase 1 — Auditoría**

- Revisar `pom.xml`.
- Revisar `application.yml`.
- Revisar entidades, repositorios y servicios.
- Revisar controladores.
- Revisar JWT.
- Revisar SecurityConfig.
- Identificar errores y componentes incompletos.
- Presentar un resumen del estado actual.

**Fase 2 — Seguridad**

- Corregir el error HTTP 403 actual.
- Verificar que el filtro JWT se ejecute.
- Eliminar la autenticación temporal innecesaria de Spring Security.
- Proteger las rutas.
- Implementar autorización por roles.
- Implementar `/auth/me`.
- Probar login y endpoints protegidos.

**Fase 3 — Empresas**

- Completar CRUD.
- Validaciones.
- Permisos.
- Aislamiento de datos.

**Fase 4 — Repartidores**

- Entidad y migración.
- CRUD.
- Validaciones y permisos.

**Fase 5 — Pedidos**

- Entidad y migración.
- CRUD.
- Asignación de repartidores.
- Estados y transiciones.
- Historial.

**Fase 6 — Seguimiento**

- Ubicaciones.
- Historial de ubicaciones.
- Consultas de seguimiento.

**Fase 7 — Módulos complementarios**

- Reclamos.
- Incidencias.
- Alertas.
- Auditoría.

**Fase 8 — Calidad y documentación**

- Pruebas.
- Swagger.
- Manejo de excepciones.
- Revisión de seguridad.
- Verificación de migraciones.
- Compilación y ejecución final.

## 13. Criterios para considerar terminado el backend

El proyecto se considerará terminado cuando:

- Compile correctamente.
- Inicie correctamente.
- Se conecte a Supabase.
- Las migraciones estén aplicadas.
- El login funcione.
- JWT proteja las rutas.
- Los roles se apliquen correctamente.
- El aislamiento entre empresas funcione.
- Los módulos principales estén implementados.
- Los errores HTTP tengan respuestas consistentes.
- Existan pruebas de los flujos principales.
- La API esté documentada.
- No existan credenciales expuestas.

## 14. Instrucción principal para OpenCode

Actúa como desarrollador backend senior especializado en Java, Spring Boot, Spring Security, JWT y PostgreSQL.

Tu objetivo es completar el backend existente, no crear otro proyecto desde cero.

Primero analiza la implementación actual y detecta qué está terminado, qué está incompleto y qué tiene errores.

Prioriza corregir el problema actual de autenticación JWT y el HTTP 403.

Después desarrolla los módulos pendientes siguiendo el orden establecido.

Antes de modificar archivos importantes, verifica sus dependencias y relaciones. Evita sobrescribir código funcional.

No inventes columnas ni relaciones incompatibles con la base de datos. Define el modelo de datos de forma coherente y utiliza migraciones Flyway nuevas.

Trabaja de manera autónoma en las tareas que estén suficientemente especificadas. Si existe una decisión de negocio que no pueda deducirse de los requisitos, documenta la duda y solicita aclaración en lugar de inventar una regla.

Después de cada fase:

1. Explica qué implementaste.
2. Enumera los archivos creados o modificados.
3. Indica las migraciones agregadas.
4. Ejecuta la compilación.
5. Ejecuta las pruebas disponibles.
6. Informa los errores pendientes.

No declares una funcionalidad terminada si solamente está creada su estructura.

**Prioridad máxima: entregar un backend funcional, seguro, probado y preparado para conectarse con el frontend React.**