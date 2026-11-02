# Memoria del Proyecto — Horizen TI (Herrera C&T)

Documento de registro de avances, decisiones de arquitectura y estado del desarrollo de la plataforma integral.

---

## Registro de Sesión — Octubre 2026

### Objetivo de la Sesión
Implementar el **módulo administrativo de certificados** de Horizen TI según las especificaciones de `propuesta_admin_certificados_horizen.md`, asegurando su integración natural con la arquitectura modular existente, el sistema de diseño oscuro, el shell de navegación unificada (`PlatformShell`), el modelo de control de acceso por áreas y roles, y manteniendo desacoplada la página pública de verificación preexistente.

---

### 1. Entregables Completados

1. **Registro del Módulo en la Plataforma Interna:**
   - Se añadió `"certificados"` al tipo `ModuleKey` y al catálogo centralizado `MODULES` en `src/modules/auth/lib/auth.ts`.
   - Aparece de forma automática en:
     - El sidebar unificado (`PlatformShell`) para trabajadores autorizados.
     - El gestor de **Áreas y roles** (`/usuarios/areas`) para que el administrador pueda habilitarlo o deshabilitarlo a nivel de área.
     - El gestor de **Usuarios** (`/usuarios`) para asignación granular de módulos por persona.
     - El hub de inicio del colaborador (`/inicio`).

2. **Página Principal de Gestión (`/certificados/gestion`):**
   - **Indicadores resumidos (`StatCard`):** Contadores calculados dinámicamente a partir del estado de las plantillas (Total, Activas, Borrador, Inactivas).
   - **Listado administrativo adaptable:** Tabla con scroll horizontal en pantallas móviles, filtros combinados por búsqueda de texto, categoría y estado.
   - **Ciclo de vida de plantillas:** Transición controlada entre estados (`draft` | `active` | `inactive`), sin eliminación permanente destructiva en esta fase.

3. **Formulario de Creación y Edición (`TemplateFormModal`):**
   - Parámetros configurables: nombre (obligatorio), categoría, versión, estado, entidad emisora, título del diploma, texto descriptivo, firmante y cargo.
   - Pestaña de **previsualización en vivo** que renderiza el diploma en tiempo real con los valores ingresados.
   - Validación accesible, prevención de doble envío (`isSubmitting`) y feedback unificado mediante toasts (`useToast`).

4. **Vista Previa Visual del Diploma (`DiplomaPreview` & `CertificatePreviewModal`):**
   - Diseño corporativo premium adaptado al sistema de diseño oscuro de Horizen: esquinas HUD, marcos dorados, tipografía editorial, marca de agua de demostración.
   - Marcadores para nombre de participante, capacitación, fecha de emisión, código de verificación y contenedor QR simulado con sello de seguridad.

5. **Simulación Conceptual de Emisión (`SimulateIssueModal`):**
   - Permite seleccionar una plantilla disponible e ingresar un nombre ficticio de demostración (prellenado: *"Sofía Mendoza Morales"*).
   - Genera una credencial simulada con código único de sesión (ej. `HZ-SIM-XXXX`).
   - Identificada explícitamente como prototipo no oficial, sin solicitar DNI, correos ni datos personales reales.
   - Enlace directo hacia el verificador público para comprobar la experiencia de consulta.

6. **Integración de Permisos por Rol:**
   - Mapeo de capacidades: `view`, `create`, `edit`, `manage_status`, `simulate_issue`.
   - Administrador de plataforma posee todos los permisos.
   - Roles de lectura (consulta, auditor) ocultan los botones de creación, edición y activación.
   - Se incluyó un selector de simulación de rol en la cabecera administrativa (*Sesión actual*, *Administrador*, *Gestor*, *Lector*) para permitir la verificación manual inmediata del comportamiento de la interfaz.

7. **Persistencia de la Maqueta:**
   - Implementada en `src/modules/certificados/lib/templates.ts` utilizando `localStorage` (`horizen_cert_templates_demo_v1`) con fallback seguro.
   - Incluye 4 plantillas iniciales de demostración:
     1. *Fundamentos de Desarrollo de Software* (Borrador — v1.0).
     2. *Gestión Empresarial* (Borrador — v1.0).
     3. *Taller de Herramientas Digitales* (Inactiva — v1.0).
     4. *Arquitectura Cloud & DevOps* (Activa — v1.2).
   - Botón visible para **"Restablecer datos iniciales de demo"**.

---

### 2. Archivos Creados y Modificados

```
Archivos Creados:
├── src/modules/certificados/
│   ├── lib/
│   │   ├── templates.ts             ← Modelo de datos, seed inicial y repositorio LocalStorage
│   │   └── permissions.ts           ← Resolver de permisos por rol y simulador de roles
│   └── components/
│       ├── DiplomaPreview.tsx        ← Componente visual del diploma Horizen
│       ├── CertificatePreviewModal.tsx ← Modal para inspección de plantilla y diploma
│       ├── TemplateFormModal.tsx     ← Modal crear/editar con validación y vista en vivo
│       ├── SimulateIssueModal.tsx    ← Modal interactivo de emisión simulada
│       └── CertificadosAdminView.tsx ← Pantalla principal de administración
├── src/app/certificados/gestion/
│   ├── layout.tsx                   ← Guard AuthGuard(module="certificados") + PlatformShell
│   └── page.tsx                     ← Renderiza CertificadosAdminView
└── MEMORIA.md                       ← Este archivo de registro histórico

Archivos Modificados:
├── src/modules/auth/lib/auth.ts     ← Registro de "certificados" en ModuleKey y MODULES
├── src/modules/shared/components/Icon.tsx ← Iconos SVG (certificate, eye, edit, plus, sparkles, copy)
└── AGENTS.md                        ← Actualización del árbol de arquitectura y rutas del Code Graph
```

---

### 3. Validaciones y Pruebas Realizadas

| Prueba | Herramienta / Método | Resultado |
|---|---|---|
| Tipado estático | `npx tsc --noEmit` | **0 errores**. Compilación limpia. |
| Ruta pública | GET `http://localhost:3000/certificados` | **200 OK**. Verificador público intacto. |
| Ruta administrativa | GET `http://localhost:3000/certificados/gestion` | **200 OK**. Layout y shell aplicados. |
| Separación conceptual | Revisión de código | Plantilla ≠ Certificado emitido ≠ Verificación pública. |
| Restricciones de seguridad | Auditoría de alcance | Sin dependencias externas añadidas, sin BD nueva. |
| CodeGraph Index | `npx -y @colbymchenry/codegraph index` | **116 archivos indexados** (1,550 nodos, 3,291 aristas). Base `.codegraph/codegraph.db` actualizada. |

---

### 4. Qué Queda Pendiente (Fase de Backend y Producción)

Para cuando el proyecto pase de la fase de prototipo frontend a producción con backend conectado:

1. **Esquema de Base de Datos en Supabase:**
   - Tabla `certificate_templates` para persistencia compartida entre usuarios.
   - Tabla `issued_certificates` para registrar diplomas emitidos oficialmente con hashes de autenticidad.
2. **Seguridad y RPCs:**
   - RPCs `SECURITY DEFINER` con prefijo `hct_` (`hct_get_templates`, `hct_save_template`, `hct_issue_certificate`).
   - RPC pública `hct_verify_certificate(p_code)` para conectar el verificador de `/certificados` con la base de datos real.
3. **Generación de Documentos Oficiales:**
   - Servicio backend para generación de diplomas en PDF vectorial de alta resolución.
   - Generación de códigos QR funcionales con enlace criptográfico directo a `/certificados?codigo=...`.
4. **Firma Digital:**
   - Mecanismo de firma digitalizada o sellado de tiempo para los firmantes autorizados.


---

## Registro de Sesión — Octubre 2026 (Mejoras en Verificación Pública de Certificados)

### Objetivo de la Sesión
Mejorar la experiencia del usuario y cliente al consultar un certificado en la ruta pública `/certificados`, garantizando diseño 100% adaptable (móviles, tablets y computadoras), nuevo flujo de validación con ventana emergente informativa («Consulta realizada. Mostrando el resultado del certificado.»), desplazamiento suave automático a la sección de resultados, y presentación estricta de solo dos estados posibles: **CERTIFICADO VÁLIDO** o **CERTIFICADO INVÁLIDO** (agrupando anulados e inexistentes), diferenciando explícitamente cualquier error técnico y destacando con alta jerarquía visual el nombre del participante.

---

### 1. Entregables Implementados

1. **Flujo de Validación y Ventana Emergente:**
   - Input optimizado con soporte para borrado rápido, atajos de demostración y atajo de teclado Enter.
   - Modal emergente no bloqueante que confirma la consulta:
     - Mensaje normativo: *«Consulta realizada. Mostrando el resultado del certificado.»*
     - Botón de cierre visible y botón de acción principal *"Ver resultado"* que enfoca la sección inferior.
     - Cierre accesible con tecla `Escape`, clic en el fondo oscurecido o botón de acción.
     - Bloqueo controlado del scroll de fondo (`body.style.overflow = "hidden"`) mientras el modal está activo.

2. **Desplazamiento Suave y Posicionamiento:**
   - Desplazamiento automático mediante `scrollIntoView({ behavior: "smooth", block: "start" })` hacia `#resultado-certificado`.
   - Compensación de altura del navbar fijo con clase utilitaria `scroll-mt-24 sm:scroll-mt-28` para evitar que la barra de navegación oculte el encabezado de resultados.

3. **Solo Dos Estados de Resultado Público:**
   - **CERTIFICADO VÁLIDO:**
     - Encabezado verde esmeralda con icono de confirmación (`check`).
     - Tarjeta destacada heroica para el **Participante acreditado** con tipografía prominente (`font-display font-black text-2xl sm:text-4xl`).
     - Cuadrícula de metadatos reales disponibles: Curso/Actividad, Código de certificado (con botón de copia), Fecha de emisión, Entidad emisora y Estado ("Válido").
   - **CERTIFICADO INVÁLIDO:**
     - Encabezado carmesí con icono de advertencia (`alert`).
     - **Caso Anulado / Revocado:** Muestra los datos conocidos en el sistema (incluyendo al participante destacado), estado "Inválido" y caja explicativa de motivo de invalidación.
     - **Caso Inexistente / No Encontrado:** Muestra código consultado, estado "Inválido" y mensaje de ausencia de registro, sin inventar participantes ficticios.

4. **Distinción Explícita de Fallos Técnicos:**
   - Los errores de conexión o del servidor muestran una tarjeta independiente: *"No fue posible realizar la consulta"*, con mensaje claro y botón para reintentar la consulta, sin clasificar falsamente la credencial como inválida.
   - Atajo de prueba interactivo `HZ-ERROR-RED` para comprobar este comportamiento de inmediato.

5. **Diseño Adaptable (Responsive):**
   - Móviles (desde 360px): formularios e inputs en columna vertical, botones de altura táctil mínima (48px), sin elementos cortados ni desborde horizontal.
   - Tablets y Escritorio: cuadrícula balanceada, marcos HUD oscuros y acentos tecnológicos alineados a la identidad corporativa de Horizen TI.

---

### 2. Validaciones y Pruebas Realizadas

| Prueba | Herramienta / Método | Resultado |
|---|---|---|
| Tipado estático | `npx tsc --noEmit` | **0 errores**. Compilación limpia. |
| Modal de consulta | Playwright (Desktop & Mobile) | **Exitoso**. Mensaje normativo exacto y cierre fluido. |
| Resultado Válido | Playwright (`HZ-DEMO-VALIDO`) | **Exitoso**. Badge esmeralda y participante destacado. |
| Resultado Inválido (Anulado) | Playwright (`HZ-DEMO-ANULADO`) | **Exitoso**. Estado único CERTIFICADO INVÁLIDO con motivo. |
| Resultado Inválido (Inexistente) | Playwright (`HZ-NO-EXISTE`) | **Exitoso**. Estado único CERTIFICADO INVÁLIDO sin datos ficticios. |
| Error Técnico | Playwright (`HZ-ERROR-RED`) | **Exitoso**. Mensaje de error técnico independiente y reintento. |
| Desborde horizontal en móvil | Playwright (Viewport 390x844) | `hasHorizontalScroll === false` (0 desborde). |
| Aislamiento de alcance | Auditoría de archivos | Panel administrativo (`/certificados/gestion`) intacto. |


---

## Actualización — Unificación de Estados Inválidos en Verificación Pública

### Cambios Aplicados
1. **Eliminación de términos internos en UI pública:** Se suprimieron totalmente las palabras *«Anulado»* e *«Inexistente»* de botones, etiquetas, alertas y descripciones públicas.
2. **Presentación de códigos de prueba unificada:**
   - `HZ-DEMO-ANULADO` — Demo Inválido.
   - `HZ-NO-EXISTE` — Demo Inválido.
3. **Estructura idéntica para CERTIFICADO INVÁLIDO:**
   - Ambos códigos renderizan exactamente la misma vista, color carmesí, icono (`alert`), aviso y estructura de datos (código consultado y estado *«Inválido»*).
   - No se expone al cliente si el certificado fue revocado o si no fue encontrado.
4. **Mantenimiento estricto de dos estados públicos:** Solo existen `CERTIFICADO VÁLIDO` y `CERTIFICADO INVÁLIDO` (manteniendo el estado de error técnico independiente para fallos de red simulados con `HZ-ERROR-RED`).
5. **Aislamiento:** Sin cambios en backend, Supabase ni en el panel de administración.


---

## Actualización — Incorporación de Iconografía Oficial (Lucide React)

### Cambios Aplicados
1. **Instalación y Configuración:**
   - Se integró el paquete oficial `lucide-react`.
2. **Certificado Válido:**
   - Incorporación de icono prominente `BadgeCheck` en verde esmeralda con halo de iluminación (`shadow-[0_0_25px_rgba(31,206,140,0.25)]`).
   - Ubicado junto al título **CERTIFICADO VÁLIDO**.
3. **Información del Participante y Campos del Certificado:**
   - `UserRound`: Participante acreditado, con tipografía heroica destacada (`font-black text-2xl sm:text-4xl`).
   - `GraduationCap`: Capacitación / Actividad.
   - `CalendarDays`: Fecha de emisión.
   - `Fingerprint`: Código de verificación institucional.
   - `Building2`: Entidad emisora.
   - `BadgeCheck`: Estado de validación ("Válido").
4. **Certificado Inválido:**
   - Incorporación de icono prominente `BadgeX` en rojo carmesí (`stroke-[2.2]`) y halo difuminado carmesí.
   - Iconografía de `Fingerprint` y `BadgeX` para los campos del resultado inválido unificado.
5. **Comprobación Visual y Responsiva:**
   - Verificado con Playwright en escritorio (1280x800) y móvil (390x844).
   - Sin desborde horizontal (`scrollWidth === clientWidth`).


---

## Actualización — Ajustes de Ventanas Emergentes y Diagnóstico Supabase

### 1. Diagnóstico de Integración con Supabase (Solo Lectura)
- **Estado de conexión:** El cliente Supabase del proyecto (`src/modules/shared/lib/supabase.ts`) conecta exitosamente con la base de datos de desarrollo (tabla `site_settings` respondió con código 200 y registros válidos).
- **Inspección de estructuras de certificados:**
  - Tablas consultadas: `certificates`, `certificados`, `issued_certificates`, `certificate_templates`, `cert_templates`.
  - Resultado: **No existen en el schema cache (PGRST205)**. No hay tablas ni vistas creadas aún en la base de datos de desarrollo para diplomas o plantillas de certificados.
  - RPC pública `hct_verify_certificate(p_code)`: **No existe en la base de datos**.
- **Qué falta para conectarlo a Supabase en producción:**
  1. Ejecutar la migración SQL para crear `certificate_templates` y `issued_certificates`.
  2. Implementar la función RPC `SECURITY DEFINER` `hct_verify_certificate(p_code TEXT)` para permitir la consulta anónima pública de certificados oficiales.
- **Seguridad:** Confirmado que **no se realizó ninguna modificación, migración, INSERT, UPDATE, DELETE ni alteración de RLS en Supabase**.

### 2. Flujo de Validación y Modales Exclusivos
- **Certificado Válido (`HZ-DEMO-VALIDO`):**
  - Eliminación total de ventanas emergentes para certificados válidos.
  - Al pulsar *«Verificar certificado»*, la validación se ejecuta y desplaza automáticamente la vista con desplazamiento suave (*smooth scroll*) hacia `#resultado-certificado`.
  - Mantiene la iconografía oficial de Lucide (`BadgeCheck`, `UserRound`, `GraduationCap`, `CalendarDays`, `Fingerprint`, `Building2`).
- **Certificado Inválido (`HZ-DEMO-ANULADO` y `HZ-NO-EXISTE`):**
  - Muestran exclusivamente el modal de **CERTIFICADO INVÁLIDO** con `BadgeX` carmesí.
  - Se eliminaron las palabras *«Anulado»* e *«Inexistente»*.
  - Comparten idéntica estructura, mensaje, diseño e iconografía.
- **Error Técnico (`HZ-ERROR-RED`):**
  - Muestra modal independiente de incidencia técnica: **NO FUE POSIBLE REALIZAR LA CONSULTA**.
  - Incorpora los botones **REINTENTAR CONSULTA** y **LIMPIAR BÚSQUEDA**.


---

## Actualización — Experiencia ante Errores de Conexión e Indicador de Carga

### 1. Mejoras Implementadas
1. **Indicador de Carga y Prevención de Duplicados:**
   - Incorporación de spinner circular animado (`Loader2` con `animate-spin`).
   - Texto de espera en el botón principal: *«Estamos verificando tu certificado…»*.
   - Deshabilitación temporal del botón (`disabled={isLoading}`) mientras la validación está en curso para evitar múltiples solicitudes simultáneas.
2. **Aviso Discreto y Amigable ante Errores de Conexión:**
   - Eliminación del modal invasivo para errores de red o servicio no disponible.
   - Mensaje amigable renderizado en el propio formulario con icono sutil `WifiOff` y atributos de accesibilidad (`role="alert"`, `aria-live="polite"`):
     *«¡Ups! No logramos conectarnos con el servicio de validación. Comprueba tu conexión e inténtalo nuevamente.»*
   - No interrumpe la navegación ni produce saltos bruscos de scroll.
3. **Botón Adaptativo («VOLVER A INTENTAR»):**
   - El botón principal cambia automáticamente a **`VOLVER A INTENTAR`** con icono `RotateCw`.
   - Permite reintentar la consulta inmediatamente sin necesidad de reescribir el código ingresado.
   - Si el reintento vuelve a fallar, mantiene el mensaje y la posibilidad de volver a intentar.
   - Si el reintento tiene éxito, retira automáticamente el aviso de error, restablece el botón a *«VERIFICAR CERTIFICADO»* y presenta el resultado.
4. **Validación Visual Automatizada (Playwright):**
   - Estado de carga con spinner y bloqueo de botón verificado.
   - Flujo de reintento fallido y exitoso validado en escritorio y móvil (390x844).
   - Sin desbordes horizontales (`scrollWidth === clientWidth`).


---

## Actualización — Implementación del Módulo Eventos y Formación y Limpieza Profesional

### 1. Limpieza de Elementos de Maqueta en Certificados
- **Eliminación de badges y avisos de desarrollo:** Se removió la etiqueta `<Badge tone="crimson">Prototipo Frontend</Badge>` y la nota inferior sobre *«Persistencia local en navegador (LocalStorage)»*.
- **Retiro de simuladores de desarrollo:** Se eliminó la barra de simulación de roles (*«Control de permisos en maqueta»*) y el botón de *«Simular emisión»* del encabezado administrativo, dejando una vista corporativa lista para producción.
- **Resolución de permisos directa:** La interfaz ahora resuelve los permisos directamente desde la sesión activa (`currentUser`) mediante `resolveCertificatePermissions(currentUser)`.
- **Preservación total de capacidades:** El repositorio de plantillas, la validación de estados y el verificador público de certificados (`/certificados`) se mantienen 100% operativos.

### 2. Arquitectura del Módulo Eventos y Formación (`src/modules/eventos/`)
- **Registro en Auth y Navegación:**
  - Registro de `"eventos"` en `ModuleKey` y catálogo `MODULES` en `src/modules/auth/lib/auth.ts` con acento azul (`text-azul`), icono `calendar` y ruta `/eventos/gestion`.
  - Aparece automáticamente en el sidebar de `PlatformShell`, en `/inicio` y en la gestión de permisos por área y usuario.
- **Ruta Administrativa:** `src/app/eventos/gestion/` protegida con `<AuthGuard module="eventos">` y envuelta en `<PlatformShell maxWidth="7xl">`.
- **Modelo de Cursos y Actividades Formativas (`src/modules/eventos/lib/events.ts`):**
  - **Tipos de actividad:** `curso`, `taller`, `seminario`, `bootcamp`, `conferencia`.
  - **Modalidades:** `presencial` (con sede/aula), `virtual` (con enlace/plataforma), `hibrida` (ambas).
  - **Estados:** `draft`, `scheduled`, `in_progress`, `completed`, `cancelled`.
  - **Horas y cronograma:** Horas académicas (> 0), fechas de inicio y fin (con validación de coherencia temporal), número de sesiones y resumen de horarios.
  - **Capacidad:** Cupos máximos o aforo ilimitado.
  - **Reglas de asistencia:** Asistencia obligatoria y porcentaje mínimo exigido (0 - 100%).
  - **Evaluación:** Examen técnico opcional con nota mínima (escala vigesimal 0-20) y proyecto final integrador.
  - **Evento de cierre:** Ceremonia o demoday de clausura opcional con fecha, horario, modalidad y asistencia obligatoria/opcional.
  - **Vinculación con Certificados (Sección H):**
    - Opción explícita: *«¿Este curso permite obtener un certificado oficial de Horizen TI?»* (SÍ / NO).
    - Si la opción es NO: El curso se almacena sin vinculación y queda documentado que no emite acreditación.
    - Si la opción es SÍ:
      - Selector de plantillas oficiales cargadas dinámicamente desde el módulo de Certificados.
      - Solo permite seleccionar plantillas con estado **`active`**. Las plantillas en borrador (`draft`) o inactivas se muestran deshabilitadas como no elegibles.
      - Previsualización en vivo de la plantilla seleccionada (nombre, texto del diploma, entidad emisora y firmante).
      - Configuración de criterios de certificación: porcentaje mínimo de asistencia, aprobación de examen técnico, entrega de proyecto final y asistencia a clausura.

### 3. Componentes Implementados
1. **`EventosAdminView.tsx`:** Tablero principal con 4 StatCards dinámicas (`Total actividades`, `En curso / progreso`, `Programados`, `Con certificación`), filtros combinados (texto, modalidad, estado y certificación), tabla responsiva con acciones y estado vacío (`EmptyState`).
2. **`CourseFormModal.tsx`:** Modal estructurado con navegación rápida por 8 secciones (A a H), validación en tiempo real y notificaciones mediante `useToast`.
3. **`CourseDetailModal.tsx`:** Modal de inspección completa de la actividad formativa, visualizando competencias, cronograma, aforo, reglas de evaluación y detalles de la certificación vinculada.
4. **Iconografía SVG Ampliada (`Icon.tsx`):** Soporte nativo para `calendar`, `academic`, `trash`, `search`, `filter`, `users`, `clock`, `map-pin` y `video`.

### 4. Pruebas y Verificación Automatizada (Playwright)
- Script de prueba integral: `scripts/test-eventos.mjs` ejecutado en Microsoft Edge.
- **Casos validados con 100% de éxito:**
  1. Login de trabajador y transición fluida por `SessionCurtain`.
  2. Aparición de tarjeta "Eventos y Formación" en `/inicio` y enlace con icono en `PlatformShell`.
  3. Visualización de StatCards y listado de cursos semilla en `/eventos/gestion`.
  4. Búsqueda y filtrado dinámico.
  5. Modal de inspección de detalles de curso.
  6. Validación de formulario: detección de fechas incompatibles (fecha fin anterior a fecha inicio) y bloqueo antes de enviar.
  7. Creación de curso con vinculación a plantilla activa de certificación (`tpl-cloud-devops`).
  8. Creación de curso sin certificación (badge *«Sin certificado»*).
  9. Verificación de limpieza en `/certificados/gestion` (0 badges de prototipo, 0 simuladores de roles, 0 botones de simulación, 0 banners de demo).
  10. Verificación de persistencia de la funcionalidad en el verificador público de certificados (`/certificados`).
- **Verificación de tipado estático:** `npx tsc --noEmit` completado con **0 errores**.
- **Índice CodeGraph actualizado:** 127 archivos, 1,706 nodos, 3,593 aristas.


---

## Actualización — Auditoría de Persistencia y Registro de Pendientes

### 1. Resumen de la Auditoría de Persistencia
Se ejecutó una auditoría integral sobre el estado de los datos en el sistema tras la puesta en marcha del módulo de Eventos y Formación:

| Capa / Módulo | Estado de Persistencia | Clasificación |
|---|---|---|
| **Autenticación y Sesión (`/login`, `PlatformShell`, perfil)** | **Supabase Auth nativo** + tabla `app_users` vía RPC `hct_my_profile`. Autenticación en servidor real con cuentas de colaborador. | **Funciona con datos reales y persistentes.** |
| **Módulos Comerciales y Operativos (Cotizaciones, Proyectos, Ventas, Mesa de Ayuda)** | Tablas PostgreSQL en Supabase (`quotes`, `client_projects`, `tickets`, `products`, `project_incomes`) con RLS y RPCs. | **Funciona con datos reales y persistentes.** |
| **Módulo Eventos y Formación (`/eventos/gestion`)** | Almacenamiento en `localStorage` (`horizen_events_courses_v1`) con inicialización desde `INITIAL_COURSES`. No existen tablas en Supabase (`PGRST205`). Sobrevive a recargas en el mismo navegador, pero no se comparte entre distintos dispositivos. | **Funciona, pero utiliza almacenamiento local.** |
| **Gestión de Plantillas de Certificados (`/certificados/gestion`)** | Almacenamiento en `localStorage` (`horizen_cert_templates_demo_v1`) con inicialización desde `INITIAL_DEMO_TEMPLATES`. No existen tablas en Supabase. | **Funciona, pero utiliza almacenamiento local.** |
| **Vinculación Curso ➔ Plantilla de Certificado** | Vinculación por ID de plantilla (`course.certification.template_id`) compartida en `localStorage` entre ambos módulos. | **Funciona, pero utiliza almacenamiento local.** |
| **Verificación Pública de Certificados (`/certificados`)** | Lógica condicional en memoria dentro de `CertificateVerifier.tsx` evaluando códigos estáticos (`HZ-DEMO-VALIDO`, `HZ-SIM-*`, `HZ-ERROR-RED`). No consulta `localStorage` ni Supabase. La RPC `hct_verify_certificate` no existe en la base de datos. | **Utiliza datos estáticos o de demostración.** |

---

### 2. Tareas Pendientes para las Siguientes Fases

Para evolucionar los módulos de **Certificados** y **Eventos y Formación** desde su estado actual de prototipo funcional local hacia un sistema empresarial con base de datos compartida y emisión real, se dejan establecidos los siguientes pendientes ordenados por prioridad:

#### Pendiente 1: Diseño y Ejecución de Migración SQL en Supabase
- **Objetivo:** Crear el esquema relacional en PostgreSQL para soportar plantillas, cursos y diplomas emitidos.
- **Tablas a crear:**
  1. `certificate_templates`: Almacén persistente de plantillas oficiales (título, texto, entidad emisora, firmante, estado `draft|active|inactive`, versión).
  2. `courses`: Almacén persistente de cursos y actividades formativas (código, título, tipo, modalidad, horas, fechas, aforo, reglas de asistencia/evaluación, evento de cierre y objeto JSON o FK hacia `certificate_templates`).
  3. `issued_certificates`: Registro de certificados emitidos a participantes reales (código único institucional `HZ-YYYY-XXXX`, curso ID, plantilla ID, nombre del participante, fecha de emisión, estado `valido|anulado`).
- **Seguridad y Funciones RPC:**
  - Políticas RLS para lectura y escritura restringidas a usuarios autenticados con módulo `certificados` o `eventos` (mediante `hct_user_has_module`).
  - RPC pública `SECURITY DEFINER` `hct_verify_certificate(p_code TEXT)` para permitir la consulta anónima desde `/certificados` sin exponer la tabla completa.

#### Pendiente 2: Migración de los Repositorios Frontend a Supabase
- **Objetivo:** Conectar las interfaces administrativas existentes a Supabase sin romper la experiencia de usuario.
- **En `src/modules/certificados/lib/templates.ts`:**
  - Reemplazar las operaciones síncronas de `localStorage` por consultas asíncronas vía `supabase.from('certificate_templates')`.
  - Mantener un fallback inteligente a `localStorage` o a las plantillas semilla si no hay conexión a internet.
- **En `src/modules/eventos/lib/events.ts`:**
  - Migrar `loadCoursesFromStorage`, `createCourse`, `updateCourse` y `deleteCourse` a consultas sobre la tabla `courses` de Supabase.

#### Pendiente 3: Conexión Real del Verificador Público
- **Objetivo:** Que cualquier certificado emitido desde la plataforma interna pueda ser consultado en tiempo real desde la web pública.
- **En `src/modules/certificados/components/CertificateVerifier.tsx`:**
  - Conectar el formulario de verificación a `supabase.rpc('hct_verify_certificate', { p_code })`.
  - Presentar la información dinámica devuelta por la base de datos (participante, curso, fecha de emisión, entidad emisora).
  - Conservar los códigos de prueba `HZ-DEMO-VALIDO` y `HZ-ERROR-RED` como modo de diagnóstico/fallback en desarrollo.

#### Pendiente 4: Módulo Operativo de Emisión de Diplomas
- **Objetivo:** Permitir a los instructores o gestores emitir credenciales a los participantes que hayan cumplido los requisitos configurados en el curso (asistencia mínima, evaluación aprobada, proyecto final).
- **Alcance:**
  - Formulario administrativo de emisión masiva o individual por curso.
  - Generación de identificador único institucional y hash de validación QR.
  - Opción de previsualización e impresión/descarga en formato PDF de alta resolución.


---

## Actualización — Retiro de Elementos de Demostración en Verificador Público

### 1. Cambios Realizados
1. **Eliminación de la Sección «Códigos de prueba rápidos»:**
   - Se removió por completo el contenedor inferior con la lista de botones rápidos en la tarjeta de consulta.
   - Retiro de `DEMO_PRESETS` y de la función auxiliar `handleQuickFill`.
2. **Retiro de Botones Visibles:**
   - `HZ-DEMO-VALIDO`, `HZ-DEMO-ANULADO`, `HZ-NO-EXISTE` y `HZ-ERROR-RED` ya no se presentan visualmente al usuario público.
3. **Actualización del Placeholder:**
   - El campo de entrada ahora muestra: *«Ingresa el código de tu certificado»* (reemplazando a *«Ej. HZ-DEMO-VALIDO»*).
4. **Preservación Integral del Comportamiento y Elementos Institucionales:**
   - Formulario de consulta con botón adaptativo «VERIFICAR CERTIFICADO» / «VOLVER A INTENTAR» e indicador de carga (`Loader2`).
   - Aviso institucional sobre el código QR y nota legal de políticas de privacidad.
   - Preservación de los estados de resultado: **Certificado válido** (directo en página, participante destacado), **Certificado inválido** (modal y vista persistente unificada) y **Error técnico** (alerta discreta amigable con reintento).
   - Preservación interna de códigos de diagnóstico en la lógica estática (`handleVerify`) para asegurar la compatibilidad con las pruebas automatizadas del proyecto.

### 2. Validaciones y Pruebas Realizadas
- **Tipado estático:** `npx tsc --noEmit` completado con 0 errores.
- **Pruebas End-to-End (`scripts/test-certificados.mjs`):**
  - Estado de carga y prevención de doble clic con spinner: Exitoso.
  - Certificado Válido (`HZ-DEMO-VALIDO`): Exitoso (aparece Juan Pérez García en verde esmeralda).
  - Certificado Inválido (`HZ-NO-EXISTE`): Exitoso (modal y vista unificada sin revelar motivo interno).
  - Error de Red / Conexión (`HZ-ERROR-RED`): Exitoso (aviso amigable en formulario y botón VOLVER A INTENTAR).
  - Flujo de reintento fallido y exitoso: Exitoso.
  - Comprobación en resolución móvil (390x844): Sin desborde horizontal (0 px overflow).
- **Comprobación de Elementos de Demo:**
  - Cantidad de elementos con texto *"Códigos de prueba rápidos"*: **0**.
  - Cantidad de botones visibles con códigos de prueba: **0**.
  - Placeholder del campo de entrada verificado: *"Ingresa el código de tu certificado"*.
- **CodeGraph Reindexado:** 127 archivos, 1,704 nodos, 3,588 aristas actualizadas en `.codegraph/codegraph.db`.


---

## Actualización — Auditoría Técnica de Supabase y Preparación de Verificación Real (Noviembre 2026)

### 1. Resumen de la Auditoría Técnica (Solo Lectura)
Se realizó una inspección exhaustiva y de solo lectura de la carpeta `supabase/`, de los módulos de frontend (`certificados` y `eventos`), y de la instancia real conectada de Supabase:

1. **Esquema SQL del Repositorio:**
   - Se inventariaron las tablas definidas en los scripts: `site_settings`, `services`, `testimonials`, `projects` (portafolio web), `leads`, `tickets`, `ticket_comments`, `quotes`, `quote_items`, `catalog_items`, `quote_term_templates`, `areas`, `area_roles`, `app_users`, `app_user_secrets`, `app_sessions`, `device_push_tokens`, `client_projects`, `client_project_*`, `project_income`, `products_ventas`, `sale_orders`, `client_users` y `client_tokens`.
   - **No existe** ninguna tabla ni función de certificados o eventos académicos en los archivos `.sql` del repositorio.
   - La función Edge `supabase/functions/notify-events/index.ts` está asignada exclusivamente al despacho de notificaciones push móviles mediante Expo ante webhooks de mutación (`INSERT`/`UPDATE` en `tickets`, `ticket_comments` y `leads`). No gestiona actividades formativas.

2. **Diagnóstico en Base de Datos Real de Supabase (Sonda de Solo Lectura):**
   - Conexión activa y autenticada con clave pública: `site_settings` responde 200 OK con registros válidos.
   - Las tablas tentativas (`certificate_templates`, `issued_certificates`, `certificates`, `certificados`, `courses`, `events`) **no existen en el schema cache (`PGRST205`)**.
   - La función RPC `hct_verify_certificate(p_code)` **no existe en el schema cache**.

3. **Arquitectura de Seguridad Identificada:**
   - Patrón obligatorio establecido: RLS activado, `revoke all on <table> from anon, authenticated`, y acceso exclusivo mediante RPCs `SECURITY DEFINER` con validación de sesión (`hct_current_user_id()`) y módulos (`hct_user_has_module(v_user_id, 'certificados')`).
   - La verificación pública debe resolverse mediante la función RPC `SECURITY DEFINER` `hct_verify_certificate(p_code TEXT)`, con permisos para `anon` y `authenticated`, devolviendo un objeto sanitizado (código, participante, capacitación, entidad emisora, fecha y estado `valid`|`invalid`), sin exponer DNI, correos, notas privadas ni motivos de anulación.

---

### 2. Tareas Pendientes y Hoja de Ruta de Implementación

Con base en la auditoría, la ruta de implementación para habilitar la verificación real de certificados queda establecida en el siguiente orden de ejecución:

#### Pendiente 1: Redacción de la Migración SQL (`supabase/migration-certificados-eventos.sql`)
- **Objetivo:** Definir el esquema relacional en PostgreSQL compatible con la arquitectura del proyecto sin modificar todavía la base de datos.
- **Alcance del archivo SQL:**
  1. Tabla `certificate_templates`: `id` (UUID PK), nombre, descripción, categoría, entidad emisora, título del diploma, texto descriptivo, firmante, cargo, estado (`draft`|`active`|`inactive`), versión, timestamps.
  2. Tabla `courses`: `id` (UUID PK), código (`CRS-YYYY-XXX` unique), título, tipo, modalidad, horas, fechas, aforo, requisitos de asistencia/evaluación, evento de cierre, y configuración de certificación vinculada a `certificate_templates(id)`.
  3. Tabla `issued_certificates`: `id` (UUID PK), código único institucional (`certificate_code text unique`), `template_id` (FK a plantillas con `on delete restrict`), `course_id` (FK a cursos con `on delete set null`), nombre del participante, identificación/DNI (privado), capacitación, entidad emisora, fecha de emisión, estado (`valido`|`anulado`), motivo de anulación (privado), `issued_by` (FK a `app_users`), timestamps.
  4. Seguridad y RLS: RLS habilitado y `revoke all from anon, authenticated` en las tres tablas.
  5. RPC pública `SECURITY DEFINER` `hct_verify_certificate(p_code TEXT)`: Concede `GRANT EXECUTE` a `anon` y `authenticated`. Normaliza el código consultado (`UPPER(REPLACE(p_code, ' ', ''))`), consulta `issued_certificates` y retorna JSON estricto (`status: "valid"` con datos públicos o `status: "invalid"` si no existe o está anulado).

#### Pendiente 2: Aplicación de la Migración en Supabase y Semillas de Prueba
- **Objetivo:** Ejecutar la migración en el SQL Editor de Supabase y verificar su disponibilidad.
- **Acciones:**
  - Ejecución del script SQL por parte del administrador en Supabase Dashboard.
  - Verificación mediante `scripts/check-supabase.mjs` de que `certificate_templates`, `issued_certificates`, `courses` y `hct_verify_certificate` figuren en el schema cache.
  - Inserción de al menos una plantilla activa oficial y un certificado emitido real para validaciones de extremo a extremo.

#### Pendiente 3: Conexión Real del Verificador Público (`CertificateVerifier.tsx`)
- **Objetivo:** Conectar el formulario público `/certificados` a la función RPC real en Supabase.
- **Acciones:**
  - Reemplazar la resolución condicional simulada por `const { data, error } = await supabase.rpc('hct_verify_certificate', { p_code: sanitized })`.
  - Mapear la respuesta al estado de la interfaz (`valid` directo con smooth scroll, o `invalid` con modal y sección persistente).
  - Conservar el manejo de error de conexión con reintento amigable (`VOLVER A INTENTAR`).

#### Pendiente 4: Migración de los Gestores Administrativos de `localStorage` a Supabase
- **Objetivo:** Proveer persistencia compartida entre usuarios y dispositivos para los módulos internos.
- **Acciones:**
  - En `src/modules/certificados/lib/templates.ts`: Migrar lectura y escritura de plantillas a Supabase mediante RPCs o consultas autorizadas con fallback offline seguro.
  - En `src/modules/eventos/lib/events.ts`: Migrar la administración de cursos a la tabla `courses` de Supabase.

#### Pendiente 5: Módulo Operativo de Emisión de Certificados
- **Objetivo:** Permitir la emisión formal de certificados a participantes que completen los requisitos de un curso.
- **Acciones:**
  - Interfaz de emisión individual y masiva desde `/certificados/gestion` o `/eventos/gestion`.
  - Generación de código institucional correlativo (`HZ-YYYY-XXXX`).
  - Generación de diplomas oficiales en PDF vectorial de alta resolución y códigos QR funcionales con enlace directo a `/certificados?codigo=HZ-...`.


---

## Actualización — Formulario Asistente por Pasos para Cursos y Actividades (Noviembre 2026)

### 1. Objetivo de la Sesión
Modernizar y transformar el formulario administrativo de creación y edición de cursos y actividades formativas en la ruta `/eventos/gestion`, pasando de un diseño plano de campos simultáneos a un **asistente de creación por pasos (Multi-Step Form Wizard)** de 6 etapas, manteniendo intacta la lógica de negocio, el modelo de datos `Course`, las validaciones estrictas y la persistencia en `localStorage`.

---

### 2. Estructura Implementada del Asistente (6 Pasos)

1. **Paso 1: Información General (`01`)**
   - Título o nombre de la actividad con validación obligatoria.
   - Selector visual de **Tipo de Actividad** en tarjetas seleccionables interactivas con iconos y descripciones contextuales:
     - *Curso Especializado* (`academic`), *Taller Práctico / Workshop* (`wrench`), *Seminario Ejecutivo* (`chip`), *Bootcamp Intensivo* (`rocket`), *Conferencia / Masterclass* (`video`).
   - Categoría temática (8 opciones corporativas existentes).
   - Instructor / Facilitador y Rol institucional.
   - Descripción detallada con textarea adaptable.
   - Gestión dinámica de **Objetivos de Aprendizaje** (adición con botón estilizado, edición en tiempo real y eliminación accesible).

2. **Paso 2: Duración y Cronograma (`02`)**
   - Cuadrícula equilibrada para: horas académicas (> 0), número de sesiones (> 0), fecha de inicio y fecha de fin.
   - Validación de coherencia temporal preventiva (bloquea el avance si `end_date < start_date` con aviso visual destacado).
   - Campo para resumen de horario y frecuencia semanal.
   - **Tarjeta de cálculo dinámico de duración:** Si las fechas son válidas, calcula automáticamente el plazo en semanas, los días calendario y el promedio de horas académicas por sesión.

3. **Paso 3: Modalidad y Capacidad (`03`)**
   - Selector en tarjetas destacadas de alta jerarquía visual para las tres modalidades:
     - *Presencial* (`building`), *Virtual (En línea)* (`video`), *Híbrida (Dual)* (`globe`).
   - Despliegue condicional de campos según la modalidad seleccionada:
     - Presencial / Híbrida: Dirección física / Sede / Aula obligatoria.
     - Virtual / Híbrida: Enlace de acceso o plataforma digital obligatoria.
   - Selector intuitivo de **Aforo:**
     - Tarjeta *Capacidad Ilimitada* (sin restricción de cupos).
     - Tarjeta *Cupos Limitados*, habilitando el campo numérico con validación (> 0).

4. **Paso 4: Asistencia y Evaluación (`04`)**
   - Organizado en dos bloques visualmente diferenciados:
     - **Bloque Asistencia:** Control tipo switch interactivo (`ToggleSwitch`) para *Asistencia obligatoria* y control deslizante (*slider*) para el porcentaje mínimo (0% - 100%) con indicador esmeralda destacado.
     - **Bloque Evaluación:** Switch para *Requiere examen o evaluación*, input de nota mínima en escala vigesimal (0 a 20) y switch para *Requiere proyecto final integrador*.

5. **Paso 5: Clausura y Certificación (`05`)**
   - Organizado en dos bloques:
     - **Bloque Clausura:** Switch para evento de cierre; al activarse despliega título, modalidad de clausura, fecha, horario, sede/enlace y checkbox de asistencia obligatoria.
     - **Bloque Certificación:** Tarjetas prominentes para *«SÍ, EMITE CERTIFICADO»* (borde esmeralda) vs *«NO EMITE CERTIFICADO»*.
     - Al habilitar certificación:
       - Selector exclusivo de plantillas con estado **`active`** (las plantillas en borrador o inactivas quedan inhabilitadas con etiqueta explicativa).
       - Previsualización en vivo de la plantilla seleccionada (nombre, texto del diploma, emisor y firmante con cargo).
       - Criterios de acreditación configurables (aprobación de evaluación, entrega de proyecto y asistencia a clausura).

6. **Paso 6: Revisión Técnica y Confirmación (`06`)**
   - Ficha consolidada con cinco tarjetas estructuradas (Información General, Cronograma, Modalidad & Capacidad, Asistencia & Evaluación, Clausura & Certificación).
   - Cada bloque incluye un botón directo de acción **«Editar»** que transporta inmediatamente al usuario al paso correspondiente para realizar ajustes rápidos.
   - Selector del **Estado inicial de la actividad** (`draft`, `scheduled`, `in_progress`, `completed`, `cancelled`).
   - Botón final de guardado con prevención de doble envío (`isSubmitting`), indicador de estado y notificación toast de confirmación.

---

### 3. Componentes y Archivos Modificados

```
Archivos Modificados:
├── src/modules/eventos/components/CourseFormModal.tsx ← Reconstrucción completa como Wizard modular de 6 pasos
├── src/modules/shared/components/Icon.tsx             ← Soporte para 'chevron-left', 'chevron-right', 'arrow-left', 'arrow-right'
└── MEMORIA.md                                        ← Registro histórico de cambios y pruebas

Archivos Creados para Pruebas:
└── scripts/test-eventos-wizard.mjs                   ← Suite integral automatizada Playwright en Microsoft Edge
```

---

### 4. Validaciones y Pruebas Realizadas

| Prueba | Herramienta / Método | Resultado |
|---|---|---|
| Tipado estático | `npx tsc --noEmit` | **0 errores**. Compilación limpia. |
| Linting estricto | `npx eslint src/modules/eventos/components/CourseFormModal.tsx` | **0 errores, 0 advertencias**. Limpieza total de hooks y tipado. |
| Validación Paso 1 (Campos obligatorios) | Playwright (Edge) | **Exitoso**. Detecta título vacío y bloquea el avance con error y toast. |
| Validación Paso 2 (Fechas incoherentes) | Playwright (Edge) | **Exitoso**. Detecta fecha de fin anterior a inicio y bloquea el avance. |
| Conservación de datos (Anterior / Siguiente) | Playwright (Edge) | **Exitoso**. Todos los valores en inputs, switches y selects persisten intactos. |
| Salto de revisión a pasos específicos | Playwright (Edge) | **Exitoso**. Botón «Editar» del bloque 2 salta a Paso 2 y regresa fluido a Paso 6. |
| Creación completa de curso | Playwright (Edge) | **Exitoso**. Registra el curso con código generado en tabla (`CRS-2026-004`). |
| Flujo de edición (`initialCourse`) | Playwright (Edge) | **Exitoso**. Precarga los datos en el wizard, permite modificar y guardar cambios. |
| Responsividad y Mobile | Playwright Viewport (390x844) | **Exitoso**. `hasHorizontalOverflow: false`, `bodyOverflow: false` (0 desborde). |
| CodeGraph Reindexado | `npx -y @colbymchenry/codegraph index` | **128 archivos indexados** (1,727 nodos, 3,635 aristas). |


---

## Actualización — Corrección UI/UX: Fijación Permanente de Cabecera y Pie en Asistente de Cursos

### 1. Diagnóstico del Problema
- **Causa raíz identificada:** El contenedor exterior del modal poseía la clase `overflow-y-auto`, y el contenedor central del modal carecía de `min-h-0` en combinación con `max-h-[94vh]`. Por especificación CSS Flexbox, los hijos de un flex container en columna tienen `min-height: auto`. Al superar el contenido la altura de la pantalla, el contenedor modal completo expandía su altura forzando el scroll en el overlay exterior, provocando que la cabecera (título principal y barra de progreso) y el stepper horizontal se desplazaran hacia arriba y desaparecieran del viewport.

### 2. Solución Técnica Implementada
1. **Contenedor exterior (`fixed inset-0`):** Se sustituyó `overflow-y-auto` por `overflow-hidden`, eliminando por completo cualquier desplazamiento en la capa exterior.
2. **Contenedor modal (`#course-wizard-modal`):** Se configuró una altura controlada `h-[92vh] sm:h-[90vh] max-h-[94vh]` con `flex flex-col overflow-hidden`.
3. **Cabecera (`Header`) y Stepper:** Se incorporó `shrink-0` a ambos elementos para garantizar que conserven su tamaño y permanezcan fijados en la parte superior sin desplazarse.
4. **Cuerpo central:** Se añadió `min-h-0` (`flex-1 min-h-0 overflow-y-auto`), convirtiéndolo en el **único elemento desplazable** del asistente.
5. **Pie de navegación (`Footer`):** Se añadió `shrink-0` asegurando su fijación permanente en la parte inferior del modal, manteniendo siempre accesibles los botones «Anterior», «Siguiente», «Cancelar» y «Crear actividad / Guardar cambios».
6. **Bloqueo de scroll en fondo:** Se agregó un `useEffect` para asignar `document.body.style.overflow = "hidden"` mientras el modal está abierto y restaurarlo al cerrarse.

### 3. Validaciones y Pruebas Realizadas
- **Suite de pruebas Playwright (`scripts/test-scroll-header.mjs`):**
  - Verificación matemática de posición `Y`: Al aplicar `scrollTop = 350` en Paso 1, la cabecera (`Y: 49.20`), el título (`Y: 89.70`), el stepper (`Y: 175.20`) y el pie (`Y: 671.39`) permanecen con variación `0px`.
  - Verificación en pasos largos (Paso 2, Paso 5 y Paso 6): Título, stepper y botones permanecen permanentemente visibles al llegar al fondo del contenido.
  - Verificación en móvil (390x844): Cabecera y pie fijos, desplazamiento interno suave y `0px` de overflow horizontal.
  - Verificación de flujo funcional (`scripts/test-eventos-wizard.mjs`): 100% aprobado.
- **Tipado estático y Linting:** `npx tsc --noEmit` (0 errores) y `npx eslint` (0 errores, 0 advertencias).
- **CodeGraph Reindexado:** 129 archivos indexados, 1,733 nodos, 3,642 aristas.

---

## Actualización — Corrección UI/UX: Eliminación de Recorte en el Pie de Página del Modal Asistente

### 1. Diagnóstico y Causa Raíz
- **Atrapamiento en Contenedor con Filtro CSS (Containing Block Trapping):**
  El modal `CourseFormModal` se renderizaba directamente dentro del árbol de componentes de `EventosAdminView.tsx`, el cual está envuelto por `<PageTransition>` en `PlatformShell.tsx`. Dicho componente aplica `filter: blur(0px)` en su `<motion.div>`. Conforme a la especificación oficial de CSS (W3C CSS Transforms & Filter Effects), cualquier elemento ancestro con propiedad `filter` distinta de `none` se convierte en el bloque contenedor (*containing block*) para todos sus elementos descendientes con `position: fixed`.
  Como consecuencia:
  - El overlay del modal (`fixed inset-0`) no se posicionaba respecto al `viewport` (`window`), sino respecto a `PageTransition` dentro de `<main>`.
  - El elemento `<main>` añade padding superior (`lg:pt-10` = 40px en escritorio, `pt-16` / `pt-20` en móvil) y desplazamiento por la barra lateral (`304px` en X).
  - El overlay quedaba desplazado 40px a 64px+ hacia abajo, proyectándose más allá del borde inferior de la ventana.
  - Al aplicar `flex items-center justify-center`, el modal se centraba respecto al overlay desplazado y no respecto a la pantalla visible, empujando la parte inferior del modal entre 25px y 240px fuera del viewport. En resoluciones como 1280x720, el fondo del modal se ubicaba en `Y = 744.8px`, recortando la mitad inferior del botón **«SIGUIENTE»**; y en dispositivos móviles (390x844 / 375x667), el pie de página quedaba completamente oculto fuera de pantalla.
- **Unidades de altura rígidas (`vh` vs `dvh`):**
  La propiedad `h-[92vh] sm:h-[90vh]` no descontaba el padding vertical del contenedor exterior ni consideraba la barra de herramientas dinámica de navegadores móviles (`dvh`).

### 2. Solución Técnica Implementada
1. **Teletransportación de Capa mediante React Portal (`createPortal`):**
   - Se importó `createPortal` de `react-dom` y `useSyncExternalStore` de `react`.
   - Se teletransportó el renderizado del modal directamente a `document.body`, desvinculándolo del árbol DOM de `<PageTransition>` y eliminando por completo el efecto de contención del filtro CSS.
   - El overlay `fixed inset-0` ahora cubre el 100% real del viewport (`top: 0, bottom: 0, left: 0, right: 0`), garantizando un centrado vertical y horizontal matemáticamente perfecto sobre la ventana del navegador.
   - Se utilizó `useSyncExternalStore` para una detección de montaje en cliente 100% segura frente a hidratación SSR, libre de re-renders en cascada o advertencias de ESLint (`react-hooks/set-state-in-effect`).
2. **Dimensionamiento y Restricciones Responsivas con Unidades Dinámicas:**
   - En el contenedor exterior: `fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden`.
   - En `#course-wizard-modal`: Se aplicó `h-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] sm:h-[88vh] md:max-h-[820px] flex flex-col rounded-2xl border border-edge bg-carbon shadow-2xl overflow-hidden`. Esto garantiza márgenes de resguardo seguros en cualquier pantalla (escritorio, laptop, tablet o móvil vertical/horizontal).
3. **Identificación y Protección del Pie de Página:**
   - Se etiquetó el contenedor inferior como `id="course-wizard-footer"` con padding de resguardo `py-3 sm:py-3.5` y `shrink-0`.
   - El botón **«SIGUIENTE»**, su texto en mayúsculas, icono y sombra resplandeciente `shadow-[0_4px_18px_rgba(216,17,43,0.45)]` disponen de holgura completa respecto a los bordes redondeados y al límite de la pantalla.
4. **Bloqueo Seguro del Scroll de Fondo:**
   - Se incorporó un efecto en `CourseFormModal` que aplica `document.body.style.overflow = "hidden"` mientras el modal está activo y restituye el scroll original al cerrarse o desmontarse.

### 3. Validaciones y Resultados de Mediciones
- **Medición de Bounding Box y Holguras en 6 Viewports (Playwright + Edge):**
  - **Desktop 1366x768:** Modal `bottom: 721.9px` (viewport 768px). Botón `bottom: 705.9px`. Holgura inferior: **+62.1px**. Sin recorte (`isBtnClippedByViewport: false`).
  - **Desktop 1280x720:** Modal `bottom: 676.8px` (viewport 720px). Botón `bottom: 660.8px`. Holgura inferior: **+59.2px**. Sin recorte (`isBtnClippedByViewport: false`).
  - **Laptop 1280x650:** Modal `bottom: 611.0px` (viewport 650px). Botón `bottom: 595.0px`. Holgura inferior: **+55.0px**. Sin recorte (`isBtnClippedByViewport: false`).
  - **Small Laptop 1024x600:** Modal `bottom: 564.0px` (viewport 600px). Botón `bottom: 548.0px`. Holgura inferior: **+52.0px**. Sin recorte (`isBtnClippedByViewport: false`).
  - **Mobile 390x844:** Modal `bottom: 836.0px` (viewport 844px). Botón `bottom: 822.0px`. Holgura inferior: **+22.0px**. Sin recorte (`isBtnClippedByViewport: false`).
  - **Mobile 375x667:** Modal `bottom: 659.0px` (viewport 667px). Botón `bottom: 645.0px`. Holgura inferior: **+22.0px**. Sin recorte (`isBtnClippedByViewport: false`).
- **Verificación de Fijación de Cabecera y Stepper (`scripts/test-scroll-header.mjs`):** 100% aprobado.
- **Verificación del Asistente Completo (`scripts/test-eventos-wizard.mjs`):** 100% aprobado (6 pasos, validaciones, creación, edición y persistencia).
- **Tipado estático y Linting:** `npx tsc --noEmit` (0 errores) y `npx eslint` (0 errores, 0 advertencias).
- **CodeGraph Reindexado:** 129 archivos indexados, 1,735 nodos, 3,645 aristas.

---

## Actualización — Estandarización y Validación Permanente de Diseño Responsive (Mobile First a Desktop)

### 1. Alcance y Directiva
Se estableció como norma transversal del proyecto que **ninguna implementación o modificación se considerará terminada sin verificación responsive real** en el espectro completo de dispositivos. Se adoptó formalmente el criterio en `AGENTS.md` y se realizaron optimizaciones visuales y estructurales en el módulo de **Eventos y Formación** (`CourseFormModal`, `CourseDetailModal` y `EventosAdminView`).

### 2. Optimizaciones de Adaptabilidad Visual y Funcional Implementadas
1. **Cabecera Adaptativa Compacta:**
   - En pantallas ultra-estrechas (320px–375px), la cabecera del modal distribuye el título, el badge y el subtítulo con `flex-wrap gap-1.5` y `min-w-0 flex-1`, evitando colisiones con el botón de cierre `X` (`shrink-0`).
   - El título principal usa `text-base sm:text-xl font-bold truncate`, luciendo equilibrado en teléfonos y robusto en escritorio.
2. **Stepper Horizontal con Desplazamiento Nativo Táctil:**
   - Botones numéricos compactos (`shrink-0 px-2 sm:px-3 py-1.5 gap-1.5`) que previenen deformación elíptica en pantallas pequeñas y permiten desplazamiento táctil suave mediante `overflow-x-auto scrollbar-none`.
3. **Pie de Página y Botones de Navegación Ergonómicos:**
   - En móviles (`< 640px`): Se optimizó el espaciado interior a `px-3.5 py-2.5` y los botones a `py-2 px-3` (Cancelar y Anterior) y `px-3.5` (Siguiente), con `gap-1.5`. Esto genera más de 40px de holgura libre, evitando cualquier solapamiento o desborde lateral incluso en pantallas de 320px de ancho, manteniendo alturas táctiles cómodas (36–40px).
   - En tablets y escritorios (`sm:`): Conserva el espaciado amplio `px-7 py-3.5` y botones con tracking corporativo extendido.
4. **Formularios y Rejillas Flexibles:**
   - Tarjetas de tipo de curso, modalidades y opciones de capacidad se distribuyen en `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`, asegurando legibilidad sin aplastamiento de contenido.
   - En etiquetas de formulario con mensajes de validación reactivos, se implementó `flex flex-wrap items-center justify-between gap-1` para que las alertas no compriman el texto del label.
5. **Estandarización en `CourseDetailModal`:**
   - Se aplicó teletransportación mediante `createPortal(..., document.body)` con `useSyncExternalStore` y bloqueo de scroll en el fondo, garantizando paridad arquitectónica y visual con el asistente de creación.

### 3. Matriz de Resultados de Verificación Responsive (Playwright + Edge)

Suite ejecutada a través de `scripts/test-responsive-matrix.mjs` evaluando la vista principal y los 6 pasos del asistente en 9 resoluciones:

| Categoría | Dispositivo / Viewport | Desborde Horizontal (`overflow-x`) | Elementos / Botones Cortados | Scroll Funcional | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| **Móvil Pequeño** | **320 × 568** (iPhone SE 1ra Gen) | **0 px (false)** | **Ninguno (false)** | Suave / Independiente | **APROBADO** |
| **Móvil Clásico** | **375 × 667** (iPhone 8 / SE 2da Gen) | **0 px (false)** | **Ninguno (false)** | Suave / Independiente | **APROBADO** |
| **Móvil Moderno** | **390 × 844** (iPhone 12 / 13 / 14) | **0 px (false)** | **Ninguno (false)** | Suave / Independiente | **APROBADO** |
| **Móvil Grande** | **430 × 932** (iPhone 14 / 15 Pro Max) | **0 px (false)** | **Ninguno (false)** | Suave / Independiente | **APROBADO** |
| **Tablet Vertical** | **768 × 1024** (iPad Vertical) | **0 px (false)** | **Ninguno (false)** | Suave / Independiente | **APROBADO** |
| **Tablet Horizontal** | **1024 × 768** (iPad Horizontal) | **0 px (false)** | **Ninguno (false)** | Suave / Independiente | **APROBADO** |
| **Laptop HD** | **1280 × 720** (Pantalla estándar 720p) | **0 px (false)** | **Ninguno (false)** | Suave / Independiente | **APROBADO** |
| **Laptop WXGA** | **1366 × 768** (Laptop común) | **0 px (false)** | **Ninguno (false)** | Suave / Independiente | **APROBADO** |
| **Escritorio FHD** | **1920 × 1080** (Full HD) | **0 px (false)** | **Ninguno (false)** | Suave / Independiente | **APROBADO** |







---

## Actualización — Implementación del Paso 2: Duración y Cronograma (Horas Normales, Chips Interactivos y Distribución Equitativa)

### 1. Contexto y Objetivos
Se implementó y perfeccionó de forma integral el **Paso 2: Duración y cronograma** dentro del asistente de creación y edición de cursos (`CourseFormModal.tsx`) del módulo **Eventos y Formación** (`/eventos/gestion`).
El objetivo alcanzado permite configurar la duración total, seleccionar los días con sesiones de clase mediante chips interactivos, distribuir de manera exacta y equitativa las horas entre las clases planificadas, ajustar individualmente los horarios y duraciones, y validar la coherencia temporal en tiempo real con diseño responsivo.

### 2. Decisiones Arquitectónicas y Reglas de Negocio
1. **Horas Normales Exclusivas (1 h = 60 min):**
   - Se eliminó cualquier ambigüedad relacionada con horas académicas o pedagógicas (45/50 min).
   - Tanto la duración total como las sesiones individuales se calculan en horas cronológicas normales.
2. **Aritmética en Unidades Enteras de 15 Minutos (0.25 h):**
   - Para erradicar los errores clásicos de coma flotante de JavaScript (`0.1 + 0.2 !== 0.3`), todos los cálculos y comparaciones se realizan en unidades enteras:
     $$\text{units} = \text{Math.round}(\text{hours} \times 4)$$
   - Todo valor de duración debe ser un múltiplo positivo estricto de 0.25 h (15 min). Valores no conformes (ej. 3.3 h, negativos o cero) son rechazados por validación en tiempo real y bloquean el avance de etapa.
   - Formato amigable en toda la interfaz (`formatHoursHuman`): `3.25 h` se muestra como `3 h 15 min`, `3.5 h` como `3 h 30 min`, `24 h` como `24 h`.
3. **Manejo Seguro de Zona Horaria en Fechas:**
   - Para evitar desfases de calendario por huso horario UTC (ej. GMT-5 restando 5 horas a medianoche), se implementó `parseLocalDate` que parsea los componentes `[YYYY, MM, DD]` a mediodía local (`12:00:00`), garantizando consistencia idéntica en cualquier navegador.
   - Cálculo inclusivo de ambos extremos en `generateDateRange` (ej. del 01 al 07 de junio genera exactamente 7 fechas).
4. **Chips Interactivos de Días de Dictado:**
   - Cada fecha dentro del rango se representa mediante un chip accesible (`aria-pressed`, `role="button"`), mostrando día de la semana (`LUN`, `MAR`...), número y mes (`7 JUN`), y estado visual (`● ACTIVO` vs `○ SIN CLASE`).
   - Acciones rápidas en la barra superior: *Todos*, *Lunes a Viernes* (días hábiles 1 a 5) y *Desmarcar*.
   - Desactivar un día retira la sesión sin destruir la configuración en memoria (`sessionConfigs`), de modo que reactivarlo restituye la duración y horario previamente personalizados.
5. **Algoritmo de Distribución Equitativa y Exacta:**
   - Función determinista `distributeHoursEquitably`:
     - $\text{totalUnits} = \text{Math.round}(\text{totalHours} \times 4)$
     - $\text{baseUnits} = \lfloor \text{totalUnits} / \text{numSessions} \rfloor$
     - $\text{residue} = \text{totalUnits} \pmod{\text{numSessions}}$
     - Las primeras $\text{residue}$ sesiones reciben $\text{baseUnits} + 1$ unidades (15 min adicionales) y el resto recibe $\text{baseUnits}$.
   - **Caso Canónico Obligatorio Validado:** 24 h en 7 sesiones:
     - $96 \text{ unidades} / 7 = \text{base } 13 \text{ unidades, residuo } 5$.
     - Primeras 5 sesiones = 14 unidades ($3.5\text{ h} = 3\text{ h } 30\text{ min}$).
     - Últimas 2 sesiones = 13 unidades ($3.25\text{ h} = 3\text{ h } 15\text{ min}$).
     - Suma exacta: $5 \times 3.5 + 2 \times 3.25 = 17.5 + 6.5 = 24.0\text{ h}$ (máxima diferencia entre clases: $\le 15\text{ min}$).
6. **Autonomía de Edición Manual y Balance Reactivo:**
   - La edición manual no gatilla redistribuciones automáticas silenciosas.
   - Botones rápidos `[-15m]` y `[+15m]` en cada tarjeta para ajuste fino en bloques de 0.25 h.
   - Indicador reactivo de balance:
     - Verde (`✓ SUMA EXACTA`): Total asignado iguala total requerido.
     - Amarillo / Oro (`FALTA X h`): Deficit de horas por distribuir.
     - Carmesí (`EXCESO X h`): Horas asignadas superan la duración total.
   - Botón explícito y destacado: **«⚡ Redistribuir horas automáticamente»** para aplicar el algoritmo cuando el usuario lo desee.
7. **Coherencia Horaria y Restricción de Medianoche:**
   - Cada sesión valida que `(end_time - start_time) en minutos == duration * 60`.
   - Se estableció que las capacitaciones en Horizen TI se dictan en el mismo día. Horarios donde `end_time <= start_time` se marcan inválidos con mensaje explícito: *"La hora de fin debe ser posterior a la de inicio en el mismo día (no se permiten horarios que crucen medianoche)"*.
   - Botón de auto-sincronización *"Sincronizar horario"* para calcular automáticamente la hora de fin según `start_time + duration`.
8. **Autogeneración Inteligente de Resumen:**
   - Botón *«Autogenerar resumen»* analiza las sesiones activas y genera la glosa descriptiva (ej. *"Lunes a Viernes 19:00 - 22:30 (GMT-5)"* o lista condensada de días de dictado).
9. **Sincronización en Paso 6 y Vista Detalle:**
   - Paso 6 (Revisión) despliega el desglose completo de clases planificadas con duración y horario.
   - `CourseDetailModal` muestra la cuadrícula de sesiones programadas cuando existen en el modelo.
   - Compatibilidad hacia atrás: cursos antiguos sin `sessions` sintetizan automáticamente el cronograma al abrirse en edición.

### 3. Archivos Modificados y Creados
- `src/modules/eventos/lib/events.ts`:
  - Definición del tipo `CourseSession` (`id`, `date`, `duration`, `start_time`, `end_time`).
  - Extensión del modelo `Course` (`sessions?: CourseSession[]`).
  - Constante `QUARTER_HOUR = 0.25`.
  - Funciones auxiliares: `hoursToQuarterUnits`, `quarterUnitsToHours`, `isValidQuarterHour`, `formatHoursHuman`, `timeStringToMinutes`, `minutesToTimeString`, `calculateEndTime`, `parseLocalDate`, `formatLocalDate`, `generateDateRange`, `distributeHoursEquitably`, `validateCourseSchedule`.
  - Actualización de `validateCourseData`.
- `src/modules/eventos/components/CourseFormModal.tsx`:
  - Estado `sessionConfigs` para preservación de configuraciones al conmutar días.
  - Implementación completa de los 5 bloques de UI del Paso 2.
  - Inclusión de `data-session-card="true"` para accesibilidad y pruebas.
  - Validación de paso en `validateStep(2)` con bloqueo estricto si existe descuadre o incoherencia.
  - Resumen detallado en Paso 6 (Bloque 2).
- `src/modules/eventos/components/CourseDetailModal.tsx`:
  - Renderizado del desglose de sesiones y badges de duración en el modal de consulta.
- `scripts/test-math-standalone.js`: Script de verificación matemática pura ejecutado en Node.
- `scripts/test-step2-schedule-e2e.mjs`: Suite Playwright E2E completa ejecutada sobre Microsoft Edge.

### 4. Pruebas Realizadas y Resultados

| Prueba | Entorno / Herramienta | Verificación / Criterio | Resultado |
|---|:---:|---|:---:|
| **Aritmética de 15 min** | `test-math-standalone.js` | `hoursToQuarterUnits`, `isValidQuarterHour`, `formatHoursHuman` | **100% Aprobado** |
| **Caso Canónico 24h / 7s** | Playwright + Edge | `[3.5, 3.5, 3.5, 3.5, 3.5, 3.25, 3.25]` con suma exacta 24.0 h | **100% Aprobado** |
| **Edición Manual y Descuadre** | Playwright + Edge | Botón `+15m` detecta `EXCESO 15 min`; botón `-15m` restaura `✓ SUMA EXACTA` | **100% Aprobado** |
| **Chips Interactivos** | Playwright + Edge | Desactivar domingo reduce a 6 clases; reactivarlo preserva datos | **100% Aprobado** |
| **Alerta Medianoche / Incoherencia** | Playwright + Edge | `end_time` anterior a `start_time` muestra alerta y bloquea; auto-sync corrige | **100% Aprobado** |
| **Autogenerar Resumen** | Playwright + Edge | Genera glosa con días y horas detectados | **100% Aprobado** |
| **Paso 6 Revisión** | Playwright + Edge | Ficha técnica muestra 7 clases con duraciones exactas | **100% Aprobado** |
| **Persistencia y Modal Detalle** | Playwright + Edge | Curso guardado en `localStorage`, consulta en `CourseDetailModal` muestra 7 sesiones | **100% Aprobado** |
| **Matriz Responsive (9 resoluciones)** | Playwright + Edge | 320x568, 375x667, 390x844, 430x932, 768x1024, 1024x768, 1280x720, 1366x768, 1920x1080 | **100% Aprobado (0 overflow)** |
| **Tipado Estático** | `npx tsc --noEmit` | Compilación de TypeScript en todo el proyecto | **0 errores** |


### 5. Pendientes y Próximos Pasos Identificados

A continuación se consolidan los requerimientos futuros y tareas pendientes para continuar la evolución del módulo **Eventos y Formación** y su integración con el resto de la plataforma Horizen TI:

1. **Refinamiento de los Pasos Posteriores del Asistente:**
   - **Paso 4 (Asistencia y Evaluación):** Incorporar ponderación porcentual configurable entre notas parciales, exámenes técnicos y proyecto final (ej. $30\%$ asistencia, $30\%$ teoría, $40\%$ proyecto integrador).
   - **Paso 5 (Clausura y Certificación):** Renderizar una previsualización en vivo del diploma oficial Horizen directamente dentro del modal cuando se seleccione una plantilla activa, sustituyendo automáticamente el nombre del curso, facilitador y horas asignadas en Paso 2.
2. **Gestión de Participantes y Asistencia por Sesión (Fase Posterior):**
   - Con la estructura de sesiones (`CourseSession`) ya implementada en el modelo de datos, la siguiente fase funcional debe construir el control de asistencia sesión a sesión para los alumnos matriculados.
   - Registro de asistencia individual (presente, tardanza, falta justificada, falta) para verificar automáticamente si el alumno cumple el porcentaje mínimo (`min_attendance_percentage`) exigido en Paso 4 para su graduación.
3. **Emisión de Certificados a Alumnos Graduados:**
   - Habilitar el flujo de emisión masiva o individual de certificados cuando el curso pase a estado `completed` y los participantes superen los requisitos de asistencia y nota mínima, generando su registro oficial en el módulo `certificados`.
4. **Migración de Persistencia (LocalStorage $\rightarrow$ Supabase):**
   - Mantener la persistencia actual en `localStorage` (`horizen_events_courses_v1`) durante la fase de prototipado UX/UI.
   - En la etapa de infraestructura backend, diseñar la migración a Supabase Database creando las tablas `events_courses` y `events_course_sessions`, aplicando RLS estricto y RPCs `SECURITY DEFINER` con prefijo corporativo `hct_*` (`hct_courses_list`, `hct_courses_save`).
5. **Vinculación con el Portal del Cliente (`modules/portal-cliente`):**
   - Permitir a las empresas cliente con capacitaciones corporativas activas consultar en su portal (`/portal/cliente`) el cronograma detallado de clases, enlace de acceso a aulas virtuales y lista de sus colaboradores inscritos.

---

## Registro de Sesión — Noviembre 2026: Mejora UX/UI del Paso 2 (Horario Global con Excepciones)

### 1. Objetivo de la Sesión
Optimizar la experiencia de usuario y presentación visual del **Paso 2 (Duración y cronograma)** en el wizard de creación y edición de cursos (`/eventos/gestion`). La mayoría de cursos repiten un mismo horario estándar a lo largo de sus sesiones activas; por ello, se implementó una barra de **Horario Habitual / Global** con derivación estricta de duración, soporte para **excepciones personalizadas por fecha**, sustitución de la lista vertical de tarjetas por una **tabla compacta en escritorio (>=768px)** y **tarjetas táctiles compactas en móvil (<768px)**, sin relajar las validaciones matemáticas ni alterar automáticamente la duración total del programa.

---

### 2. Entregables Implementados

1. **Barra de Horario Habitual / Global (Bloque 3):**
   - Selector de hora de inicio (`globalStartTime`, default "19:00") y hora de fin (`globalEndTime`, default "21:00").
   - Indicador dinámico de **duración derivada** en tiempo real mediante `calculateDurationFromTimes` (ej. "2 h por sesión").
   - Validación estricta con `validateScheduleTimes`: exige horas en formato HH:mm, prohíbe cruces de medianoche (`endMin <= startMin`) y restringe la duración a múltiplos enteros de 15 minutos (0.25 h).
   - Botón principal de acción: **«Aplicar a por defecto»** (o *«Aplicar a todas»* si no existen excepciones), actualizando las sesiones no modificadas.
   - Botón condicional secundario: **«Aplicar a todas (incluir excepciones)»**, visible únicamente cuando existen fechas personalizadas, permitiendo sobrescritura total con notificación explícita.

2. **Derivación Estricta de Duración desde el Horario:**
   - La duración de cada clase ya no se ingresa en un campo numérico separado propenso a contradicciones con el horario. Se calcula de forma unívoca y estricta: `duración = (horaFin - horaInicio) / 60`.
   - Se mantiene el acoplamiento 100% conforme con las reglas del negocio: clases diurnas dentro del mismo día calendario y duración en pasos de 15 minutos.

3. **No Sobrescritura de las Horas Totales del Curso:**
   - Aplicar el horario habitual o registrar excepciones **NO altera** `academic_hours` (la duración total del curso se mantiene intacta bajo el control del usuario).
   - Si la suma de las sesiones activas difiere del total requerido, el panel de balance (Bloque 4) detecta el descuadre inmediatamente (`FALTA X` o `EXCESO X`) e indica las 4 vías de resolución:
     1. Ajustar el Horario Habitual y volver a aplicar.
     2. Configurar excepciones puntuales en fechas específicas.
     3. Pulsar «⚡ Redistribuir horas automáticamente» para un reparto determinista equitativo.
     4. Modificar la duración total del curso en el Bloque 1 si el alcance del programa cambió.
   - El botón «Siguiente» permanece estrictamente bloqueado mientras persista el descuadre.

4. **Tabla Compacta de Resumen en Escritorio (`hidden md:block`, >=768px):**
   - Sustituye las tarjetas verticales de gran altura (~1050px) por una tabla compacta (~280px para 7 clases) con 5 columnas optimizadas:
     - Col 1: `#` (01, 02...).
     - Col 2: `Fecha` (formato corto `getSessionShortLabel`, ej. `Lun., 1 jun.`).
     - Col 3: `Duración` (badge numérico claro en horas normales).
     - Col 4: `Horario` (`19:00 – 21:00`).
     - Col 5: `Estado / Acciones`:
       - Píldora de estado: `Por defecto` (gris neutro) o `Modificado` (azul corporativo).
       - Botón `Cambiar`: abre la edición inline de esa fila para ajustar hora inicio y fin.
       - Botón `Restaurar`: (visible en modificadas) revierte la sesión al horario habitual vigente y restablece el estado a `is_custom: false`.
       - Botón `X`: desactiva la fecha de clase.

5. **Edición Puntual Inline (Excepciones):**
   - Al pulsar «Cambiar», la fila o tarjeta se transforma en modo edición sin abrir modales invasivos.
   - Muestra inputs de hora de inicio y fin, indicador de duración calculada en vivo y botones de confirmación «Guardar» y «Cancelar».
   - Al guardar, valida los horarios y marca la sesión con `is_custom: true`.

6. **Tarjetas Compactas en Móvil (`md:hidden`, <768px):**
   - Presentación compacta y vertical con áreas táctiles mínimas cómodas ($\ge 36\text{px}$ – $38\text{px}$).
   - Cabecera con número, fecha corta, badge de estado y botón de eliminación directa.
   - Selector inline de horas inicio/fin accesible para pantallas táctiles estrechas.

7. **Preservación de Excepciones y Persistencia en `sessionConfigs`:**
   - La propiedad opcional `is_custom?: boolean` en `CourseSession` garantiza compatibilidad hacia atrás con registros antiguos en `localStorage` (`undefined` evalúa a falso).
   - Desactivar un día en el selector de chips y reactivarlo conserva su configuración personalizada intacta gracias al cache reactivo `sessionConfigs`.
   - El botón «Aplicar a por defecto» actualiza únicamente las sesiones sin excepción, preservando las personalizadas.

8. **Visualización en `CourseDetailModal`:**
   - Las sesiones que constituyen excepciones se identifican con la etiqueta `Excepción` en la cuadrícula de consulta de detalles del curso.

---

### 3. Archivos Modificados

- `src/modules/eventos/lib/events.ts`:
  - Se añadió `is_custom?: boolean` al tipo `CourseSession`.
  - Se crearon y exportaron `calculateDurationFromTimes(startTime, endTime): number` y `validateScheduleTimes(startTime, endTime): { valid: boolean; error?: string; durationHours: number }`.
- `src/modules/eventos/components/CourseFormModal.tsx`:
  - Se añadieron estados `globalStartTime`, `globalEndTime`, `editingSessionDate`, `tempStartTime`, `tempEndTime`.
  - Se implementó `getSessionShortLabel(dateStr)`.
  - Se implementaron handlers: `handleApplyGlobalSchedule`, `handleStartEditingSession`, `handleCancelEditingSession`, `handleSaveSessionException`, `handleRestoreSessionToDefault`.
  - Actualización de `handleToggleDate`, `handleSelectAllDates` y `handleSelectWeekdays` para aplicar el horario global y respetar `sessionConfigs`.
  - Sustitución de Bloque 4 por:
    - **Bloque 3:** Horario Habitual de Clases (barra interactiva con badge de duración y acciones).
    - **Bloque 4:** Balance de Distribución de Horas (indicadores, alerta con 4 vías de solución y botón de redistribución automática).
    - **Bloque 5:** Detalle y Horario por Sesión (tabla compacta de escritorio + tarjetas compactas móviles).
    - **Bloque 6:** Resumen de Horario y Frecuencia (autogeneración de glosa).
- `src/modules/eventos/components/CourseDetailModal.tsx`:
  - Incorporación del badge `Excepción` en sesiones con `is_custom: true`.
- `scripts/test-math-standalone.js`:
  - Incorporación de pruebas unitarias para `calculateDurationFromTimes` y `validateScheduleTimes`.
- `scripts/test-step2-schedule-e2e.mjs`:
  - Suite de pruebas E2E y matriz responsive completa con Playwright y Microsoft Edge.
- `scripts/test-audit-deep.mjs`:
  - Suite de auditoría profunda sobre registros existentes, bloqueos estrictos e independencia de excepciones.

---

### 4. Resultados de las Pruebas

| Prueba | Herramienta | Verificación | Resultado |
|---|:---:|---|:---:|
| **Aritmética y Horarios** | `test-math-standalone.js` | `calculateDurationFromTimes`, `validateScheduleTimes`, múltiplos 0.25h | **100% Aprobado** |
| **Tabla Compacta (Desktop)** | Playwright + Edge | 7 sesiones renderizadas en tabla compacta con duraciones exactas | **100% Aprobado** |
| **Horario Habitual** | Playwright + Edge | Aplicación global (18:00–21:00, 3h) actualiza sesiones por defecto | **100% Aprobado** |
| **Bloqueo por Descuadre** | Playwright + Edge | Detección de `FALTA 3 h`; clic en «Siguiente» es bloqueado con toast informativo | **100% Aprobado** |
| **Excepción Puntual** | Playwright + Edge | Edición de Sesión #1 (17:00–21:00, 4h) marca `Modificado` sin alterar Sesión #2 | **100% Aprobado** |
| **Preservación de Excepciones** | Playwright + Edge | Cambio de horario global (18:30–21:00) conserva Sesión #1 modificada | **100% Aprobado** |
| **Restauración** | Playwright + Edge | Botón «Restaurar» revierte Sesión #1 al horario global y a estado `Por defecto` | **100% Aprobado** |
| **Sobrescritura Total** | Playwright + Edge | Botón «Aplicar a todas (incluir excepciones)» homologa todo el calendario | **100% Aprobado** |
| **Redistribución Automática** | Playwright + Edge | «⚡ Redistribuir horas automáticamente» cuadra `✓ SUMA EXACTA` (24.0 h) | **100% Aprobado** |
| **Conmutación de Chips** | Playwright + Edge | Desactivar y reactivar fecha conserva configuración previa en `sessionConfigs` | **100% Aprobado** |
| **Flujo Completo del Wizard** | Playwright + Edge | Paso 1 $\rightarrow$ 6, guardado con toast oficial y visualización en modal de detalle | **100% Aprobado** |
| **Compatibilidad con CRS Antiguo** | `test-audit-deep.mjs` | Curso preexistente CRS-2026-001 abre detalle y edición sin errores | **100% Aprobado** |
| **Matriz Responsive (9 resoluciones)** | Playwright + Edge | 320x568, 375x667, 390x844, 430x932, 768x1024, 1024x768, 1280x720, 1366x768, 1920x1080 | **100% Aprobado (0 overflow)** |
| **Tipado Estático** | `npx tsc --noEmit` | Compilación de TypeScript estricta | **0 errores** |
| **Errores en Consola del Navegador** | Playwright + Edge | Cero excepciones o errores de JavaScript detectados | **0 errores** |
