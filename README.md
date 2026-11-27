# Kanban Pro

Proyecto final de la UF1 de M0612 (Desarrollo web en entorno cliente).

He partido del tablero Kanban que hice en la AC6 y le he añadido dos cosas:

1. **Arrastrar tareas entre columnas**, usando la librería **SortableJS**.
2. **Un tutorial** hecho con **Driver.js** que explica cómo se usa lo anterior.

Demo: `https://angelomisuraca.github.io/PF1-JS-Kanban-Pro/`

---

## Funcionalidad 1: drag & drop con SortableJS

### Por qué he elegido esta librería

En la AC6, para pasar una tarea de "Per fer" a "En procés" había que abrir el desplegable de la tarjeta y cambiar el estado. Para cambiar el orden dentro de una columna estaban los botones ▲ y ▼. Funcionaba, pero en un Kanban lo que todo el mundo intenta hacer primero es coger la tarjeta y arrastrarla. Así que me pareció la mejora que más sentido tenía para esta app en concreto.

Miré la opción de hacerlo con la API de Drag & Drop nativa de HTML5, pero hay que controlar bastantes eventos a mano (`dragstart`, `dragover`, `drop`...) y en el móvil no funciona bien. SortableJS me lo resolvía mejor por varios motivos:

- Se carga con una sola etiqueta `<script>` desde CDN y no depende de nada más (ni jQuery ni frameworks).
- Funciona con ratón y también con pantalla táctil.
- Trabaja directamente sobre los contenedores que ya tenía (`#todo-list`, `#in-progress-list`, `#done-list`), así que no he tenido que cambiar la estructura del HTML.
- Trae animaciones y añade clases CSS mientras arrastras, y con eso se ve dónde va a caer la tarjeta.

### Qué uso de la librería

Todo está en `app.js`, en las funciones `initDragAndDrop()` y `handleDragEnd()`.

**`Sortable.create(elemento, opciones)`**: crea la lista "arrastrable". Lo llamo una vez por cada columna (`.column-content`) con estas opciones:

| Opción | Para qué la uso |
|---|---|
| `group: 'kanban'` | Las tres columnas tienen el mismo grupo, por eso se pueden pasar tarjetas de una a otra. Sin esto solo podrías reordenar dentro de la misma columna. |
| `handle: '.drag-handle'` | Solo se arrastra desde el icono ⠿. Lo hice así porque si se podía coger la tarjeta entera, al clicar en el desplegable o en los botones a veces empezaba a arrastrarse. |
| `draggable: '.task-card'` | Le dice qué elementos de la lista se pueden mover. |
| `animation: 150` | Una animación corta cuando las demás tarjetas se recolocan. |
| `ghostClass`, `chosenClass`, `dragClass` | Son las clases que SortableJS pone a la tarjeta mientras la mueves. Les he dado estilo en `styles.css`: borde discontinuo en el hueco donde va a caer, sombra y un poco de giro. |
| `emptyInsertThreshold: 40` | Para poder soltar tarjetas en una columna vacía. Además le puse un `min-height` a las columnas porque, si no, una columna vacía no tenía altura y no había dónde soltar. |
| `onEnd: handleDragEnd` | La función que se ejecuta al soltar la tarjeta. |

**El objeto `evt` que recibe `onEnd`**: de aquí saco:
- `evt.item`: la tarjeta que se ha movido.
- `evt.to`: la lista donde se ha soltado. Con `evt.to.closest('.column').dataset.status` sé a qué estado ha pasado la tarea.

### Cómo se integra con lo que ya tenía

Lo que más me preocupaba era que el drag & drop no se "desincronizara" del resto de la app, que la tarjeta estuviera en una columna pero el array `state` dijera otra cosa.

- **HTML:** las columnas ya tenían `data-status` desde la AC6 (`todo`, `in-progress`, `done`), así que SortableJS puede saber a qué columna va la tarjeta sin cambiar nada. En el `<template>` de la tarjeta solo he añadido el `<span class="drag-handle">⠿</span>`.
- **Arranque:** en `initApp()` he añadido `initDragAndDrop()` después del primer renderizado. SortableJS se engancha a las columnas y no a las tarjetas, así que aunque `renderAllTasks()` vacíe y vuelva a pintar las listas, el drag & drop sigue funcionando.
- **Al soltar una tarjeta** (`handleDragEnd`) hago lo mismo que ya hacía el desplegable en la AC6:
  - pongo el nuevo valor en el `<select>` de la tarjeta;
  - pongo o quito la clase `completed` (tachado y borde verde);
  - llamo a `updateTaskCount()` para actualizar el Web Component `<task-badge>`.
- **`syncStateFromDOM()`:** esta función es nueva. Recorre las columnas en orden y reconstruye el array `state` según dónde están realmente las tarjetas en pantalla. Así el estado y el orden quedan guardados, y si luego añado una tarea y se vuelve a pintar todo, cada tarjeta sigue en su sitio.
- Lo que había antes sigue funcionando igual: el desplegable, los botones ▲ ▼, eliminar y el acordeón de las columnas. Arrastrar es una forma más de hacer lo mismo, no sustituye a nada.

---

## Funcionalidad 2: tutorial con Driver.js

En la cabecera hay un botón de **Ayuda** que lanza el tutorial (`setupHelpTour()` y `startTour()` en `app.js`).

Para crearlo uso `window.driver.js.driver`, que es cómo queda disponible la librería cuando la cargas desde la CDN. Le paso los textos de los botones en catalán, `showProgress: true` para que se vea en qué paso vas, y la lista de pasos. Luego lo arranco con `driverObj.drive()`.

Cada paso tiene un `element` (lo que se resalta) y un `popover` (el título y el texto). Driver.js se encarga de oscurecer el resto de la página, hacer scroll hasta el elemento y colocar la caja al lado.

Los pasos explican solo la funcionalidad nueva:

1. Un mensaje de bienvenida explicando la novedad (sin elemento, sale centrado).
2. El icono ⠿: desde dónde se coge la tarjeta.
3. El tablero: si la sueltas en otra columna, el estado cambia solo.
4. La columna "Completat": si la tarea acaba ahí, queda tachada.
5. El botón de Ayuda: para volver a ver el tutorial.

Un detalle que tuve que arreglar: Driver.js tiene su propio CSS, y al pasar el ratón por el botón "Següent" el fondo se ponía casi blanco con la letra blanca y no se leía. Lo solucioné con una regla más específica en `styles.css` para los estados `:hover` y `:focus` de ese botón.

---

## Archivos

- `index.html`: la estructura y los `<script>` / `<link>` de las dos librerías (SortableJS 1.15.6 y Driver.js 1.3.1 desde jsDelivr).
- `styles.css`: los estilos de la AC6 y, al final, los nuevos (icono de arrastre, clases de SortableJS, botón de ayuda y ajustes de Driver.js).
- `app.js`: el código de la AC6 y, al final, el de las dos funcionalidades nuevas.
