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
2. Escribir: “Tengo 20 toneladas mensuales de cascarilla disponibles en Corrientes”.
3. Revisar los datos extraídos por la IA: producto, cantidad, ubicación y frecuencia.
4. Completar precio y especificaciones pendientes.
5. Publicar la oferta.
6. Ver compradores recomendados y la explicación de cada coincidencia.
7. Elegir una contraparte e iniciar el contacto.
8. Confirmar un resumen preliminar de cantidad, frecuencia y entrega.

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
2. Escribir: “Necesito 20 toneladas de cascarilla por mes durante 12 meses”.
3. Revisar la necesidad interpretada por la IA.
4. Ver proveedores compatibles ordenados por cantidad, distancia y frecuencia.
5. Comparar costo del material, transporte y costo total estimado.
6. Revisar condiciones técnicas pendientes.
7. Seleccionar la oferta de la arrocera.
8. Preparar un pedido recurrente sujeto a confirmación.

### Para etapas posteriores

- Publicar múltiples necesidades.
- Solicitar y comparar cotizaciones.
- Guardar proveedores habituales.
- Negociar condiciones y adjuntar documentación.
- Gestionar contratos de 3, 6 o 12 meses.
- Controlar calendario, entregas e incumplimientos.

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

1. El vendedor publica la oferta con IA.
2. El comprador expresa su necesidad y obtiene coincidencias.
3. Ambas partes seleccionan la operación recomendada.
4. El transportista confirma una ruta compatible.
5. BioNexo presenta costo total, emisiones y resumen recurrente.

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

