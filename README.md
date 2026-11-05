# Metrocron

Una web app sencilla para practicar guitarra con el tiempo y el pulso bajo control.

## Funciones

- Temporizador configurable en minutos y segundos.
- Metrónomo sincronizado automáticamente con cada sesión.
- Temporizador utilizable con o sin metrónomo.
- Modo de metrónomo independiente.
- Tempo ajustable entre 30 y 240 BPM.
- Ajuste rápido del tempo en pasos de 1 o 5 BPM.
- Compases de 3/4, 4/4 y 6/4 con acento visual y sonoro.
- Acento sonoro del primer pulso configurable.
- Selector compacto de blanca, negra, corchea y semicorchea, con su dibujo y duración en una sola fila.
- El BPM siempre representa negras; los indicadores visuales muestran los pulsos del compás. El patrón de clics se reinicia en cada compás para marcar siempre su inicio, con acento si está activado. Si la figura no encaja exactamente en el compás, el último intervalo se acorta hasta el siguiente inicio.
- Cuatro sonidos sintetizados mediante Web Audio API.
- Salida de audio sin amplificación extra ni compresor dinámico; volumen de la app ajustable entre 0 y 100 %, combinado con el volumen del dispositivo.
- Diseño responsive para escritorio y móvil.
- En móvil, selector entre vistas compactas del temporizador y el metrónomo.
- La última vista seleccionada en móvil se recuerda entre sesiones.
- Instalable como aplicación web (PWA) en Android y iOS.
- Interfaz y audio disponibles sin conexión tras la instalación.
- Tema claro, oscuro o sincronizado con el dispositivo.
- Cuenta atrás visible en el título de la pestaña durante la práctica.
- Alarma breve al completar el tiempo de práctica.
- Audio generado en segundo plano para mantener el metrónomo y la alarma durante el bloqueo de pantalla en navegadores móviles compatibles con AudioWorklet.
- Duración, tempo, compás, figura rítmica, sonido y volumen guardados entre sesiones.

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicación no necesita variables de entorno ni servicios externos.

## Instalar en el móvil

La aplicación publicada en HTTPS se puede añadir a la pantalla de inicio:

- **Android:** abre Metrocron en Chrome y elige **Instalar aplicación** o **Añadir a pantalla de inicio** en el menú.
- **iPhone/iPad:** abre Metrocron en Safari, toca **Compartir** y elige **Añadir a pantalla de inicio**.

Al abrirla desde el icono se muestra sin la interfaz del navegador. La instalación no requiere publicar una app en las tiendas. Las opciones de audio en segundo plano siguen dependiendo del navegador y del sistema operativo.

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
