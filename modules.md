# transcendence

## 🧱 Módulos del Proyecto

| Módulo | Estado |
|--------|---------|
| **Web** |
| Backend con Fastify (Major) | ❌ |
| Frontend con Tailwind + TS (Minor) | ❌ |
| Base de datos SQLite (Minor) | ❌ |
| Blockchain (Major) | ❌ |
| **User Management** |
| Gestión de usuarios y autenticación (Major) | ❌ |
| Autenticación remota OAuth 2.0 (Major) | ❌ |
| **Gameplay y UX** |
| Jugadores remotos (Major) | ❌ |
| Multijugador (Major) | ❌ |
| Opciones de personalización (Minor) | ❌ |
| Chat en vivo (Major) | ❌ |
| **AI / Algoritmos** |
| Oponente IA (Major) | ❌ |
| Dashboard de estadísticas (Minor) | ❌ |
| **Ciberseguridad** |
| WAF / ModSecurity / Vault (Major) | ❌ |
| GDPR + anonimización (Minor) | ❌ |
| 2FA + JWT (Major) | ❌ |
| **DevOps** |
| Microservicios backend (Major) | ❌ |
| Monitoring (Minor) | ❌ |
| Gestión de logs con ELK (Major) | ❌ |
| **Gráficos** |
| 3D avanzado con Babylon.js (Major) | ❌ |
| **Accesibilidad** |
| Soporte en todos los dispositivos (Minor) | ❌ |
| Compatibilidad entre navegadores (Minor) | ❌ |
| Multilenguaje (Minor) | ❌ |
| Accesibilidad visual (Minor) | ❌ |
| SSR (Minor) | ❌ |
| **Server-Side Pong** |
| Pong con API (Major) | ❌ |
| CLI contra web users (Major) | ❌ |


## 📝 Tareas

| Tarea | Encargado | Estado |
|-------|------------|--------|
| Dockerfile que arranque el proyecto | David | 🔄 |
| Ver gestion del chat | David | 🔄 |
| Frontend en ts en vez de jsx puro | David | 🔄 |
| Hacer testeos y pruebas por separado de cada modulo | David | 🔄 |
| Probar jugadores remotos desde otros ordenadores | David | 🔄 |
| Ver si se guarda el registro de usuarios en sqlite y si esta todo bien implementado | David | 🔄 |
|  | David | 🔄 |
|  | David | 🔄 |
| Configurar rutas y endpoints REST | Sergio | ❌ |
| Integrar base de datos SQLite | Jefferson | ❌ |
| Implementar autenticación OAuth2 | Roberto | ❌ |
| Probar endpoints y seguridad | Noe | ❌ |

Si hicieramos todos los modulos tendriamos 21 puntos. Los necesarios para 100% son 7 y para el bonus 9.5.

## Estado de los módulos

### Web
| Módulo | Comentarios | Estado |
|--------|-------------|--------|
| Backend con Fastify (Major) | Servidor, game loop y sockets: ver [pon-server.js](pon-server.js) | Completado |
| Frontend con Tailwind + TS (Minor) | Tailwind configurado ([tailwind.config.js](tailwind.config.js)); frontend es React (JSX) sin TypeScript: [frontend/package.json](frontend/package.json) | Parcial |
| Base de datos SQLite (Minor) | Sequelize y modelos en [backend/db.js](backend/db.js); storage ./backend/database.sqlite | Completado |
| Blockchain (Major) | No hay implementaciones en el repo | No implementado |

### User Management
| Módulo | Comentarios | Estado |
|--------|-------------|--------|
| Gestión de usuarios y autenticación (Major) | Rutas y lógica: [backend/auth.js](backend/auth.js) (login/register/logout/me, sessions) | Completado |
| Autenticación remota OAuth 2.0 (Major) | Callback Google presente: `authGoogleCallback` en [backend/auth.js](backend/auth.js) | Completado |

### Gameplay y UX
| Módulo | Comentarios | Estado |
|--------|-------------|--------|
| Jugadores remotos (Major) | Rooms y UI list: [frontend/src/Components/Matches.jsx](frontend/src/Components/Matches.jsx) + servidor (pon-server.js) | Completado |
| Multijugador (Major) | 1v1, manejo de salas y unión desde frontend y backend | Completado |
| Opciones de personalización (Minor) | updateProfile en backend y UI en [frontend/src/Components/Profile.jsx](frontend/src/Components/Profile.jsx) | Completado |
| Chat en vivo (Major) | No se detectan handlers/events de chat en sockets ni UI dedicada | No implementado |

### AI / Algoritmos
| Módulo | Comentarios | Estado |
|--------|-------------|--------|
| Oponente IA (Major) | Lógica de IA en servidor (referencias en pon-server.js) | Completado |
| Dashboard de estadísticas (Minor) | UI de estadísticas y match history en [frontend/src/Components/Profile.jsx](frontend/src/Components/Profile.jsx); endpoints backend en [backend/auth.js](backend/auth.js) | Completado |

### Ciberseguridad
| Módulo | Comentarios | Estado |
|--------|-------------|--------|
| WAF / ModSecurity / Vault (Major) | No implementado | No implementado |
| GDPR + anonimización (Minor) | No implementado | No implementado |
| 2FA + JWT (Major) | JWT implementado en [backend/auth.js](backend/auth.js), 2FA ausente | Parcial |

### DevOps
| Módulo | Comentarios | Estado |
|--------|-------------|--------|
| Microservicios backend (Major) | No implementado | No implementado |
| Monitoring (Minor) | No implementado | No implementado |
| Gestión de logs con ELK (Major) | No implementado | No implementado |

### Gráficos
| Módulo | Comentarios | Estado |
|--------|-------------|--------|
| 3D avanzado con Babylon.js (Major) | No hay evidencia | No implementado |

### Accesibilidad / Compatibilidad
| Módulo | Comentarios | Estado |
|--------|-------------|--------|
| Soporte en todos los dispositivos (Minor) | UI usa clases responsive de Tailwind (parcial) | Parcial |
| Compatibilidad entre navegadores (Minor) | No hay pruebas automáticas; parece parcial | Parcial |
| Multilenguaje (Minor) | Strings de múltiples idiomas en [frontend/src/Context/AuthContext.jsx](frontend/src/Context/AuthContext.jsx) | Completado |
| Accesibilidad visual (Minor) | No hay auditoría ni roles/ARIA claros | No implementado |
| SSR (Minor) | No implementado | No implementado |

### Server-Side Pong
| Módulo | Comentarios | Estado |
|--------|-------------|--------|
| Pong con API (Major) | API + ciclo de juego en servidor (pon-server.js) | Completado |
| CLI contra web users (Major) | No implementado | No implementado |

---

Total de puntos obtenidos (si los módulos marcados como "Completado" estuvieran perfectos):
- Puntos asignados por módulo: Major = 1, Minor = 0.5
- Puntos obtenidos = 9.0
- Puntos máximos (según modules.md) = 21.0

Puntuación final: **9.0 / 21.0**