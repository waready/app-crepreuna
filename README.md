# App CEPREUNA

Aplicacion movil institucional para estudiantes y docentes de CEPREUNA. Esta construida con Expo SDK 54, React Native y Expo Router, y consume exclusivamente la API Laravel multiciclo.

## Alcance

- Acceso separado para estudiantes y docentes.
- Cursos, horarios, asistencia, materiales y perfil del ciclo activo.
- Pagos, test vocacional y certificados para estudiantes.
- Sesiones, recursos y entrega de preguntas Word para docentes.
- Publicaciones, comentarios y notificaciones institucionales.
- El cliente nunca selecciona ni envia `id_periodo`; el backend resuelve el ciclo activo.

## Desarrollo

```bash
npm ci
npm start
```

La URL predeterminada es `https://sistemas.cepreuna.edu.pe/api/app/v1`. Para usar otro ambiente, crea un `.env.local` a partir de `.env.example`.

Validaciones locales:

```bash
npm run lint
npm run typecheck
npm run export:web
```

## Compilacion

El perfil `preview` genera un APK instalable y `production` genera los artefactos para las tiendas:

```bash
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform all --profile production
```

GitHub Actions valida cada cambio. Al conectar este repositorio desde la configuracion de GitHub del proyecto en Expo, un push a `master` ejecuta `.eas/workflows/build.yml` y genera el APK de prueba automaticamente.
