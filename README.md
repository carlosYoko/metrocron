# Metrocron

Una web app sencilla para practicar guitarra con el tiempo y el pulso bajo control.

## Funciones

- Temporizador configurable en minutos y segundos.
- Metrónomo sincronizado automáticamente con cada sesión.
- Temporizador utilizable con o sin metrónomo.
- Modo de metrónomo independiente.
- Tempo ajustable entre 30 y 240 BPM.
- Compases de 3/4, 4/4 y 6/4 con acento visual y sonoro.
- Acento sonoro del primer pulso configurable.
- Cuatro sonidos sintetizados mediante Web Audio API.
- Salida de audio amplificada moderadamente y control de picos para mejorar la audibilidad.
- Diseño responsive para escritorio y móvil.
- Tema claro, oscuro o sincronizado con el dispositivo.
- Cuenta atrás visible en el título de la pestaña durante la práctica.
- Alarma breve al completar el tiempo de práctica.
- Audio generado en segundo plano para mantener el metrónomo y la alarma durante el bloqueo de pantalla en navegadores móviles compatibles con AudioWorklet.
- Duración, tempo, compás, sonido y volumen guardados entre sesiones.

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicación no necesita variables de entorno ni servicios externos.

Para abrir la aplicación desde un móvil conectado a la misma red Wi-Fi:

```bash
npm run dev:mobile
```

Abre en el móvil una de las direcciones `http://...` que muestra el comando. Si no conecta, permite Node.js en el firewall de Windows para redes privadas. Esta dirección local usa HTTP; para probar audio en segundo plano, el navegador móvil puede exigir HTTPS porque AudioWorklet solo está disponible en contextos seguros.

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
