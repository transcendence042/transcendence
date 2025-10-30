# Documentacion de los cambios respecto al transcendence anterior

## Migracion a ts

Para ello he añadido la dependencia dentro del frontend de ts con el comando npm i -g typescript, ademas de unas dependencias para poder hacer ts con react en desarrollo con los comandos : npm install --save-dev typescript @types/react @types/react-dom && npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin.

Tambien un pluggin para en live con ambos servidores conectados que me fuera saliendo los errores con los cambios y ver que la modificar cada archivo todo terminase igual: npm install -D vite-plugin-checker. El checker lo he añadidod en los plugins en vite.config.js.

HE BORRADO ESLINT PORQUE ME ESTABA DANDO BASTANTES PROBLEMAS POR EL MOMENTO. EN PARTE PORQUE NO ES NECESARIO.

---

Tras de jsx a tsx estan arreglados los conflictos y el proyecto arranca

## Guía del Makefile para el proyecto Transcendence

### Reglas principales:

#### `make all` (por defecto)
- Crea directorios de datos en `/home/${USER}/data/` para persistencia
- Construye todas las imágenes Docker desde cero
- Levanta todos los servicios (backend + frontend) en modo detached (-d)
- **Uso típico:** Primera vez que ejecutas el proyecto o después de cambios importantes

#### `make build`
- Solo construye las imágenes Docker sin ejecutarlas
- Útil para verificar que los Dockerfiles están correctos
- **Uso típico:** Después de cambiar Dockerfiles pero antes de levantar servicios

#### `make down`
- Para todos los contenedores del proyecto
- Los contenedores siguen existiendo, solo están parados
- **Uso típico:** Cuando quieres parar temporalmente el proyecto

#### `make clean`
- Para todos los contenedores + ejecuta `docker system prune -a`
- Elimina imágenes no utilizadas, contenedores parados, redes y caché de build
- **Uso típico:** Limpieza intermedia para liberar espacio

#### `make fclean`
- **Limpieza total y destructiva**
- Para todos los contenedores del sistema
- Elimina todos los volúmenes, imágenes, redes, contenedores y caché
- Borra físicamente `/home/${USER}/data/` (base de datos incluida)
- **Uso típico:** Reset total del entorno Docker

#### `make re`
- Equivale a `make clean && make all`
- Limpieza intermedia + construcción completa
- **Uso típico:** Cuando quieres reiniciar limpio pero conservando algunos datos

### Reglas de monitoreo:

#### `make logs`
- Muestra y sigue los logs de todos los contenedores en tiempo real
- **Uso típico:** Debug de errores o monitoreo durante desarrollo

#### `make status`
- Muestra el estado actual de todos los contenedores (running, stopped, etc.)
- **Uso típico:** Verificar rápidamente qué servicios están activos

#### `make restart`
- Reinicia todos los contenedores sin reconstruir imágenes
- **Uso típico:** Aplicar cambios de configuración sin rebuild
