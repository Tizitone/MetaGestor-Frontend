---
name: angular-official
description: Skill oficial para el desarrollo en Angular con componentes standalone, Signals y buenas prácticas de arquitectura.
---

# Angular Official Guidelines

- **Standalone Components:** Prioriza siempre componentes, directivas y pipes standalone en lugar de NgModules tradicionales.
- **State Management:** Utiliza Angular `signal()`, `computed()` y `effect()` para la gestión de estados locales y reactividad fina.
- **Control Flow:** Emplea obligatoriamente la nueva sintaxis nativa de control de flujo en las plantillas HTML (`@if`, `@for`, `@switch`) en lugar de las directrices antiguas (`*ngIf`, `*ngFor`).
- **Dependency Injection:** Utiliza la función `inject()` en lugar de la inyección por constructor para mayor limpieza y legibilidad en servicios y componentes.
- **Routing:** Configura el enrutamiento utilizando cargas perezosas (`lazy loading`) con `loadComponent` y rutas basadas en funciones.