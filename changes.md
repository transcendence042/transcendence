# Documentacion de los cambios respecto al transcendence anterior

## Migracion a ts

Para ello he añadido la dependencia dentro del frontend de ts con el comando npm i -g typescript, ademas de unas dependencias para poder hacer ts con react en desarrollo con los comandos : npm install --save-dev typescript @types/react @types/react-dom && npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin.

Tambien un pluggin para en live con ambos servidores conectados que me fuera saliendo los errores con los cambios y ver que la modificar cada archivo todo terminase igual: npm install -D vite-plugin-checker. El checker lo he añadidod en los plugins en vite.config.js.

HE BORRADO ESLINT PORQUE ME ESTABA DANDO BASTANTES PROBLEMAS POR EL MOMENTO. EN PARTE PORQUE NO ES NECESARIO.

---

Tras de jsx a tsx estan arreglados los conflictos y el proyecto arranca

### Nuevos cambios

- Deshabilidato oauth de momento

- Creada la carpeta public y quitado del arranque del backend la carga de css y de ts porque no es necesario y daba problemas de arranque
