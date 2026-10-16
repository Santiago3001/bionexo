# Producto

## Objetivo de la demostración

Mostrar en cinco minutos que BioNexo puede conectar a un vendedor, un comprador y un transportista, y presentar el costo y el impacto ambiental estimado de una operación.

## Datos preparados para la demo

Todos los elementos siguientes son **DATO SIMULADO**:

- Vendedor: Arrocera Corrientes.
- Oferta: 20 toneladas mensuales de cascarilla.
- Comprador: Industria Biomasa NEA.
- Necesidad: 20 toneladas mensuales durante 12 meses.
- Transportista: Logística Ruta NEA.
- Ruta A: 120 km.
- Ruta B o retorno compatible: 80 km.
- Factor de emisión: 0,09 kg CO₂e/t-km.
- Precio y tarifa: valores simulados visibles en la interfaz.

## Guion de cinco minutos

### 0:00–0:30 · Problema

Explicar que la arrocera tiene cascarilla, la industria necesita abastecimiento y el transportista posee capacidad disponible, pero los tres actores no cuentan con una conexión organizada.

### 0:30–1:20 · Vendedor

1. Abrir el perfil de la arrocera.
2. Escribir: “Tengo 20 toneladas mensuales de cascarilla en Corrientes”.
3. Mostrar cómo la IA extrae producto, cantidad, ubicación y frecuencia.
4. Confirmar la publicación.

Mensaje clave: la IA reduce el esfuerzo de publicar, pero el vendedor confirma los datos.

### 1:20–2:20 · Comprador

1. Abrir el perfil de la industria.
2. Escribir: “Necesito 20 toneladas por mes durante 12 meses”.
3. Mostrar la coincidencia con la arrocera.
4. Explicar cantidad, distancia, frecuencia y requisitos pendientes.
5. Seleccionar la oferta.

Mensaje clave: la IA interpreta; la base de datos y las reglas encuentran la coincidencia.

### 2:20–3:15 · Transportista

1. Abrir el perfil del transportista.
2. Mostrar vehículo, capacidad y ruta disponible.
3. Marcar el viaje de retorno compatible.
4. Confirmar disponibilidad y tarifa simulada.

Mensaje clave: BioNexo incorpora el transporte antes de presentar el costo total.

### 3:15–4:20 · Comparación ambiental

1. Comparar una ruta de 120 km con una alternativa de 80 km.
2. Mostrar toneladas-kilómetro y factor de emisión.
3. Presentar 216 kg CO₂e frente a 144 kg CO₂e.
4. Indicar una diferencia estimada de 72 kg CO₂e, equivalente al 33%.
5. Abrir el Reporte de Impacto BioNexo.

Mensaje clave: el reporte es informativo, declara sus supuestos y no es una certificación.

### 4:20–5:00 · Cierre de operación

1. Mostrar el resumen: vendedor, comprador, transportista, cantidad, frecuencia, costo y emisiones.
2. Preparar un borrador de abastecimiento recurrente.
3. Cerrar con el lema: “Conectamos lo que producís con quien lo necesita”.

## Pantallas necesarias

1. Inicio y selector de usuario.
2. Publicación asistida del vendedor.
3. Búsqueda del comprador y recomendación.
4. Selección del transportista.
5. Comparador económico y ambiental.
6. Resumen final de la operación.

El chat, el contrato y el panel pueden mostrarse como vistas resumidas. No deben consumir tiempo del recorrido principal.

## Plan de respaldo

Si falla la API de IA:

- Mostrar la solicitud previamente procesada e identificarla como respaldo.
- Continuar con la consulta a la base de datos.
- No afirmar que la respuesta fue generada en vivo.

Si falla el servicio de rutas:

- Usar distancias marcadas como **DATO SIMULADO**.
- Mantener visible la fórmula del cálculo.

## Pitch de un minuto

Una arrocera puede tener cascarilla disponible sin saber quién la necesita. Una industria puede buscar ese material sin encontrar un proveedor cercano. Y un transportista puede volver vacío sin conocer una carga compatible.

BioNexo NEA conecta a los tres. La inteligencia artificial interpreta lo que ofrecen o necesitan, mientras la plataforma consulta datos controlados para recomendar una coincidencia, incorporar transporte y mostrar el costo total.

En nuestra demo, una oferta de cascarilla se convierte en una operación recurrente y comparamos dos alternativas logísticas con sus emisiones estimadas. El reporte declara datos, fórmula y supuestos: informa, pero no certifica.

BioNexo conecta lo que producís con quien lo necesita y transforma información dispersa en oportunidades productivas para el NEA.

## Preguntas del jurado

### ¿Cómo saben que existe el problema?

Todavía es una hipótesis. Debe validarse con entrevistas y operaciones reales de arroceras, compradores y transportistas.

### ¿Por qué utilizan IA?

Para interpretar descripciones distintas, extraer datos y explicar resultados. La búsqueda y los cálculos se realizan con la base y reglas controladas.

### ¿Por qué participa el transportista?

Porque el costo y la distancia pueden decidir si una coincidencia comercial es viable. Integrarlo permite mostrar costo total y opciones de retorno.

### ¿Cómo calculan el impacto ambiental?

En el prototipo se multiplican toneladas, kilómetros y un factor por tonelada-kilómetro. Los valores son simulados; un piloto deberá usar factores documentados y datos del vehículo.

### ¿El reporte es una certificación?

No. Es un informe transparente con metodología y supuestos. Una certificación requeriría una entidad competente.

### ¿Cómo gana dinero BioNexo?

La hipótesis combina comisión por operación, coordinación logística y servicios empresariales. La disposición a pagar todavía debe validarse.

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| No existe suficiente oferta o demanda | Empezar con una cadena y zona concretas |
| La IA inventa información | Limitarla a interpretar y explicar datos controlados |
| Faltan requisitos técnicos | Mostrar campos pendientes y exigir validación especializada |
| El transporte vuelve inviable el negocio | Incorporar costo y distancia antes de confirmar |
| El factor ambiental es incorrecto | Documentar fuente, versión y supuestos |
| La demo intenta mostrar demasiado | Mantener seis pantallas y un único recorrido |
| Los datos simulados parecen reales | Etiquetarlos de forma visible en toda la demo |

## Próximos pasos

1. Validar el problema con los tres tipos de usuario.
2. Reemplazar perfiles simulados por casos anonimizados y autorizados.
3. Validar requisitos técnicos de la cascarilla.
4. Incorporar un factor de emisión documentado.
5. Acompañar manualmente una primera operación piloto.
6. Medir contactos, cotizaciones, entregas y repetición.
7. Validar quién paga y cuánto.
