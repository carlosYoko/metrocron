# Metrocron

Una web app sencilla para practicar guitarra con el tiempo y el pulso bajo control.

## Funciones

- Temporizador configurable en minutos y segundos.
- Metrónomo sincronizado automáticamente con cada sesión.
- Modo de metrónomo independiente.
- Tempo ajustable entre 30 y 240 BPM.
- Compases de 3/4, 4/4 y 6/4 con acento visual y sonoro.
- Acento sonoro del primer pulso configurable.
- Cuatro sonidos sintetizados mediante Web Audio API.
- Diseño responsive para escritorio y móvil.
- Tema claro, oscuro o sincronizado con el dispositivo.
- Cuenta atrás visible en el título de la pestaña durante la práctica.
- Alarma breve al completar el tiempo de práctica.
- Duración, tempo, compás, sonido y volumen guardados entre sesiones.

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicación no necesita variables de entorno ni servicios externos.

## Comandos

```bash
npm run lint
npm run build
npm run preview
```

## Estructura

```text
src/
├── components/  # Controles visuales
├── config/      # Sonidos y límites del metrónomo
├── hooks/       # Motor del temporizador y del audio
├── App.jsx      # Estado y sincronización de la sesión
└── styles.css   # Sistema visual responsive
```
