# Solución

## Idea elegida

BioNexo NEA conecta vendedores, compradores y transportistas mediante un agente de IA y datos controlados.

Para la demostración, una arrocera publica cascarilla, una industria busca abastecimiento y un transportista ofrece capacidad. La plataforma encuentra la coincidencia, compara la logística y estima el impacto ambiental del traslado.

## Principios del producto

- La IA interpreta solicitudes y explica resultados.
- La base de datos aporta perfiles, publicaciones y oportunidades.
- Reglas controladas calculan compatibilidad, rutas, costos y emisiones.
- Ninguna acción comercial importante se confirma sin intervención humana.
- Todo perfil, precio y resultado ficticio se identifica como **DATO SIMULADO**.

## Funcionalidades del vendedor

### Para mostrar en la demo

1. Ingresar con un perfil de arrocera.
2. Responder en lenguaje natural la pregunta: **“¿Qué subproducto querés vender?”**
3. Escribir: “Tengo 20 toneladas mensuales de cascarilla de arroz disponibles en Corrientes”.
4. Revisar los campos que la IA pudo extraer de la respuesta.
5. Completar manualmente los datos comerciales, técnicos y logísticos que falten.
6. Confirmar y publicar la oferta. La IA no publica ni inventa datos por su cuenta.
7. Ver compradores cuya necesidad sea compatible con la oferta.
8. Revisar por qué se produjo cada coincidencia y qué información falta validar.
9. Elegir una contraparte e iniciar el contacto.
10. Confirmar un resumen preliminar de cantidad, frecuencia y entrega.

### Datos de una oferta de subproducto

La publicación del vendedor debe contener estos datos:

| Grupo | Dato | Obligatorio en la demo | Ejemplo |
|---|---|---|---|
| Identificación | Nombre del subproducto | Sí | Cascarilla de arroz |
| Identificación | Categoría | Sí | Subproducto agroindustrial |
| Origen | Proceso que lo genera | Sí | Molienda de arroz |
| Disponibilidad | Cantidad y unidad | Sí | 20 toneladas |
| Disponibilidad | Frecuencia | Sí | Mensual |
| Disponibilidad | Fecha o período disponible | Sí | Durante 12 meses |
| Ubicación | Lugar de retiro | Sí | Corrientes, Argentina |
| Condición | Estado y presentación | Sí | Seco y a granel |
| Calidad | Humedad, pureza, granulometría u otros parámetros | Si se conocen | Humedad: pendiente de análisis |
| Comercial | Precio por unidad o “a cotizar” | Sí | Precio por tonelada: a cotizar |
| Comercial | Lote mínimo | Sí | 10 toneladas |
| Logística | Quién retira o entrega | Sí | Retiro a cargo del comprador |
| Logística | Forma y medios de carga | Sí | Carga a granel; medio de carga por confirmar |
| Seguridad | Restricciones de manipulación o almacenamiento | Sí | Mantener seco |
| Evidencia | Fotos, ficha técnica o análisis | No | Ficha técnica pendiente |
| Contacto | Empresa y persona responsable | Sí | Arrocera Corrientes; contacto simulado |

Los requisitos técnicos dependen del material y de su uso. Los ejemplos de esta tabla son **DATO SIMULADO** y deben ser validados antes de una operación real.

### Ejemplo completo de carga del vendedor

> **Pregunta de BioNexo:** ¿Qué subproducto querés vender?
>
> **Respuesta del vendedor:** “Tengo cascarilla de arroz generada en nuestra planta de Corrientes. Dispongo de 20 toneladas por mes durante los próximos 12 meses. Está seca y a granel. El comprador debe retirarla. El precio es a cotizar”.

La IA propone este borrador para que el vendedor lo revise:

- Subproducto: cascarilla de arroz.
- Categoría: subproducto agroindustrial.
- Origen: molienda de arroz.
- Cantidad: 20 toneladas por mes.
- Disponibilidad: recurrente durante 12 meses.
- Ubicación: Corrientes, Argentina.
- Presentación: seca y a granel.
- Precio: a cotizar por tonelada.
- Entrega: retiro a cargo del comprador.
- Datos pendientes: humedad, granulometría, lote mínimo, medio de carga y ficha técnica.

El vendedor corrige o completa los campos pendientes y recién entonces selecciona **Publicar oferta**. Todo el ejemplo es **DATO SIMULADO**.

### Para etapas posteriores

- Gestionar varias publicaciones y productos.
- Recibir solicitudes de cotización.
- Adjuntar fichas técnicas y certificados.
- Negociar mediante chat persistente.
- Crear contratos recurrentes y seguir entregas.
- Consultar ventas, alertas e informes acumulados.

## Funcionalidades del comprador

### Para mostrar en la demo

1. Ingresar con un perfil de industria de biomasa.
2. Responder en lenguaje natural la pregunta: **“¿Qué material necesitás comprar?”**
3. Escribir: “Necesito 20 toneladas de cascarilla de arroz por mes durante 12 meses, con retiro en un radio de hasta 150 km”.
4. Revisar los datos extraídos: material, cantidad, frecuencia, duración, ubicación y requisitos.
5. Confirmar la búsqueda. Esa necesidad se compara con las ofertas publicadas por vendedores.
6. Ver ofertas compatibles ordenadas por cantidad, distancia, frecuencia y requisitos técnicos.
7. Comparar costo del material, transporte y costo total estimado.
8. Revisar coincidencias, diferencias y datos técnicos pendientes.
9. Seleccionar la oferta de la arrocera.
10. Preparar un pedido recurrente sujeto a confirmación de ambas partes.

### Datos de la necesidad del comprador

- Material o categoría buscada.
- Cantidad y unidad.
- Frecuencia y duración.
- Lugar de uso o entrega.
- Radio máximo de búsqueda.
- Precio máximo o solicitud de cotización.
- Requisitos de calidad y uso previsto.
- Presentación aceptada.
- Fecha desde la que necesita abastecimiento.
- Modalidad de retiro o entrega.
- Documentación exigida.

Si un dato no está en la pregunta, BioNexo lo marca como **pendiente**; no lo inventa.

### Para etapas posteriores

- Publicar múltiples necesidades.
- Solicitar y comparar cotizaciones.
- Guardar proveedores habituales.
- Negociar condiciones y adjuntar documentación.
- Gestionar contratos de 3, 6 o 12 meses.
- Controlar calendario, entregas e incumplimientos.

## Cómo hace BioNexo el matching

El sistema no busca una “venta” a partir de una pregunta aislada. Compara una **necesidad de compra confirmada** con las **ofertas publicadas y confirmadas** por los vendedores.

1. La IA convierte el texto del vendedor y del comprador en campos estructurados.
2. Cada usuario revisa y confirma sus datos.
3. El backend filtra ofertas incompatibles por material, disponibilidad, cantidad, ubicación o requisitos obligatorios.
4. Las ofertas restantes reciben un puntaje según cantidad cubierta, frecuencia, distancia, precio y calidad declarada.
5. BioNexo muestra las mejores coincidencias y explica tanto los puntos compatibles como los datos pendientes.
6. El comprador selecciona una oferta y el vendedor recibe la solicitud de contacto o cotización.

Ejemplo de coincidencia **DATO SIMULADO**:

| Criterio | Oferta del vendedor | Necesidad del comprador | Resultado |
|---|---|---|---|
| Material | Cascarilla de arroz | Cascarilla de arroz | Coincide |
| Cantidad | 20 t/mes | 20 t/mes | Coincide |
| Duración | 12 meses | 12 meses | Coincide |
| Distancia | Dentro de 150 km | Máximo 150 km | Coincide |
| Presentación | Seca y a granel | A granel | Coincide |
| Humedad | Pendiente | Máximo a definir | Requiere validación |
| Precio | A cotizar | A cotizar | Requiere cotización |

Resultado mostrado: **“Coincidencia alta: 5 criterios compatibles y 2 puntos pendientes”**. El puntaje es **DATO SIMULADO** y no reemplaza la evaluación técnica ni la aceptación comercial.

## Funcionalidades del transportista

### Para mostrar en la demo

1. Ingresar con un perfil de transportista.
2. Informar vehículo, capacidad, origen, destino y fecha disponible.
3. Marcar un viaje como ruta planificada o retorno disponible.
4. Ver la operación compatible entre arrocera y comprador.
5. Consultar distancia, peso y restricciones declaradas.
6. Cargar una tarifa o aceptar una tarifa **DATO SIMULADO**.
7. Confirmar disponibilidad para el traslado.
8. Ver la entrega incorporada al resumen de operación.

### Para etapas posteriores

- Publicar rutas y capacidad recurrente.
- Recibir alertas de cargas compatibles.
- Participar en cargas consolidadas.
- Gestionar cotizaciones y estados del viaje.
- Registrar retiro, tránsito y entrega.
- Consultar historial, ingresos e indicadores de ocupación.

## Funcionalidades compartidas

- Registro y perfiles por rol.
- Ofertas y necesidades puntuales o recurrentes.
- Búsqueda en lenguaje natural.
- Recomendaciones comerciales explicadas.
- Comparador logístico y económico.
- Mensajería vinculada con la operación.
- Resumen de condiciones con confirmación de las partes.
- Panel de operaciones y seguimiento.
- Borradores de contratos de abastecimiento.
- Reportes económicos y ambientales.

## Impacto ambiental

### Función mostrada en la demo

BioNexo comparará dos alternativas de transporte y mostrará:

- Toneladas transportadas.
- Distancia por alternativa.
- Toneladas-kilómetro.
- Factor de emisión utilizado.
- Emisiones estimadas en kg de CO₂e.
- Diferencia absoluta y porcentual entre alternativas.

Fórmula inicial:

`kg CO₂e = toneladas × kilómetros × factor de emisión en kg CO₂e/t-km`

Ejemplo **DATO SIMULADO**:

| Variable | Ruta A | Ruta B |
|---|---:|---:|
| Carga | 20 t | 20 t |
| Distancia | 120 km | 80 km |
| Factor | 0,09 kg CO₂e/t-km | 0,09 kg CO₂e/t-km |
| Emisiones | 216 kg CO₂e | 144 kg CO₂e |

En este ejemplo, la Ruta B estima 72 kg CO₂e menos, una reducción del 33%. Todos los valores son **DATO SIMULADO**.

### Límites del cálculo

- El factor real deberá provenir de una fuente documentada.
- Se deberá registrar el tipo de vehículo y combustible cuando sea posible.
- Un viaje de retorno no equivale automáticamente a cero emisiones.
- El reporte será informativo y no una certificación.
- No se afirmarán emisiones evitadas por valorización del residuo sin metodología validada.

## Flujo integrado de cinco minutos

1. BioNexo pregunta al vendedor qué subproducto quiere vender.
2. La IA completa un borrador; el vendedor corrige los campos y publica la oferta.
3. BioNexo pregunta al comprador qué material necesita.
4. La IA estructura la necesidad; el comprador la confirma.
5. El sistema compara la necesidad confirmada con las ofertas publicadas y explica la mejor coincidencia.
6. El comprador selecciona la oferta y el vendedor recibe la solicitud.
7. El transportista confirma una ruta compatible.
8. BioNexo presenta costo total, emisiones y resumen recurrente.

## Alcance obligatorio del prototipo

- Una consulta real a una API de IA.
- Entre 8 y 12 perfiles identificados como **DATO SIMULADO**.
- Una oferta, una necesidad y una ruta compatibles.
- Recomendación consultada desde la base de datos.
- Cálculos logísticos y ambientales controlados.
- Una acción final confirmable por el usuario.

## Fuera del recorrido principal

- Pagos reales.
- Contratos legalmente celebrados.
- Optimización logística avanzada.
- Certificación ambiental.
- Verificación automática de calidad.
- Marketplace nacional para todos los sectores.
- Blockchain o tokenización.

