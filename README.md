# Gastos

App web (GitHub Pages) para anotar gastos y ver el total del mes.
Corre sobre el backend reutilizable **`bds`** (ver el repo `backend-bds`):
los datos viven en un Google Sheet (dominio `gastos`) y la app lee/escribe a
través de un Web App de Apps Script.

```
Navegador (esta página) ──bt-core.js──▶ MOTOR bds (/exec) ──▶ Google Sheet del dominio "gastos"
```

Columnas del Sheet (fila 1 = encabezado): `fecha`, `monto`, `detalle`.
La `fecha` la autocompleta el motor al guardar (zona horaria Argentina).

## Acceso

- Lo maneja **`bt-core.js`** (común a todas las apps): la **primera vez** te pide
  **crear una contraseña**; en cada **dispositivo nuevo** la pide **una vez** y
  guarda una clave en el navegador. Como todas las apps comparten origen, se pide
  una sola vez por dispositivo.
- El repo **no guarda ningún secreto**.

## Archivos

- `index.html` — estructura + estilo "plotter" (el acceso lo inyecta `bt-core.js`)
- `app.js` — lógica de la vista (formulario monto/detalle, total del mes, lista)
- `bt-core.js` — cliente común del backend bds (acceso + llamadas, **no tocar**)
- `config.js` — sólo la URL del Web App (**no tocar**)

## Publicar en GitHub Pages (repo nuevo)

1. Creá un repo nuevo en GitHub (ej. `gastos`), subí estos archivos a `main`.
2. Settings → Pages → Source: `main` / `/ (root)`.
3. Queda en `https://joacomedel.github.io/gastos/`.

> El Web App de Apps Script queda **fijado a la versión desplegada**: si cambiás el
> motor (`Code.gs` en `backend-bds/engine/`), hay que sacar una **Nueva versión** del deploy.
> Para esta app no hace falta: el motor ya soporta dominios nuevos sin tocarlo.
