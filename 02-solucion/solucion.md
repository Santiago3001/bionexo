# Solución

## Idea elegida

BioNexo NEA conecta vendedores, compradores y transportistas mediante perfiles por rol, datos controlados y un agente de IA.

Para la demostración, una arrocera publica cascarilla, una industria busca abastecimiento y un transportista ofrece capacidad. La plataforma filtra por producto, calcula score de coincidencias, permite compra en 5 pasos, trueque en 7 pasos, cotiza rentabilidad del vendedor, optimiza rutas del transportista y muestra sostenibilidad ISO 14001.

Fuente de funcionalidades: documento `BioNexo NEA: funcionalidades por usuario`.

## Principios del producto

- La IA interpreta texto libre y explica resultados, no publica por su cuenta.
- La base de datos aporta perfiles, publicaciones y oportunidades.
- Reglas controladas calculan score, costos, fletes, CO2, equivalencias de trueque y pagos de rutas.
- Ninguna acción comercial importante se confirma sin intervención humana.
- Todo perfil, precio y resultado ficticio se identifica como **DATO SIMULADO**.

## Usuarios

- **Comprador:** industria que carga requerimientos, compara ofertas por score, compra o propone trueque, registra su propio subproducto y consulta sostenibilidad.
- **Vendedor:** arrocera o generador que publica subproductos, negocia por chat, acepta trueques, cotiza rentabilidad y sigue envíos e impacto.
- **Transportista:** ofrece capacidad en mapa de cargas, toma cargas, consolida, compara 4 tipos de ruta y arma la mejor ruta, incluidas rutas de trueque.

Las empresas, cantidades, precios, tarifas y resultados utilizados son **DATO SIMULADO**.

## 1. Funcionalidades del comprador

| Funcionalidad | Qué hace el usuario | Qué hace el sistema |
|---|---|---|
| Registro y perfil | Carga nombre, empresa, CUIT, ciudad, email y rubro, y elige el rol Comprador. | Crea el perfil simulado y habilita solo las pantallas de ese rol. |
| Cargar requerimiento | Elige el producto, las toneladas por mes y la ciudad de entrega. | Filtra las publicaciones del mismo producto. |
| Dashboard de coincidencias | Revisa las ofertas y las ordena por score, precio o distancia. | Calcula el score /100 (35% distancia, 30% precio, 20% disponibilidad, 15% calidad), los km, el costo, el flete, el total y el CO2 del transporte. Marca PRIORIDAD 1. |
| Circuito de compra (5 pasos) | Pulsa Comprar y recorre los pasos: oferta, chat, condiciones, contrato y orden. | Muestra el chat formal simulado, el resumen de condiciones, el contrato anual borrador (mensual × 12) y la orden confirmada con flete asignado. |
| Detector de trueque | Ve la etiqueta TRUEQUE POSIBLE en el dashboard o en el Agente IA. | Detecta que el vendedor necesita algo que el comprador genera. |
| Trueque (7 pasos) | Pulsa Proponer trueque, revisa la tabla de equivalencia, compensa la diferencia en dinero y elige el flete (por tramo o compartido). | Calcula Lote A US$760 contra Lote B US$420 y una diferencia de US$340. Genera el chat de trueque, el contrato de permuta y la orden doble con 2 fletes. |
| Registrar mi subproducto | Carga producto, toneladas, precio de referencia, ubicación y descripción. | Lo publica con calidad 7/10 y lo deja visible para los matches y para los trueques. |
| Agente IA | Escribe en texto libre, por ejemplo “20 t de cascarilla, lo más barato” o “quiero hacer un trueque”. | Detecta producto, toneladas, ciudad y la intención (cerca, barato, trueque). Muestra el top 5 con los botones Comprar y Proponer trueque. |
| Sostenibilidad Empresa (ISO 14001) | Consulta el avance por cláusulas, los indicadores propios, la evolución, las brechas y el plan de acción. Descarga el reporte PDF. | Calcula el % por cláusula y el global, y la comparación mes anterior / mes actual / meta. Suma las toneladas del trueque al indicador. No muestra datos de transporte. |
| Perfil | Ve sus datos y su rol actual. Cambia de rol. | Cierra la sesión al cambiar de rol. |

## 2. Funcionalidades del vendedor

| Funcionalidad | Qué hace el usuario | Qué hace el sistema |
|---|---|---|
| Registro y perfil | Se registra con el rol Vendedor. | Habilita sus pantallas. |
| Publicar subproducto | Carga producto, toneladas, precio, ubicación y descripción. | Lo agrega a las publicaciones. Queda visible para los compradores. |
| Mis publicaciones | Revisa su tabla de publicaciones. | Muestra sus publicaciones o 3 de ejemplo si no tiene. |
| Chat y negociación | Abre la negociación con un comprador. | Muestra el chat formal simulado y el circuito de compra. |
| Propuestas de trueque | Recibe y acepta la propuesta o hace una contrapropuesta. | Muestra la equivalencia y el contrato de permuta, y asigna los fletes. |
| Seguimiento de envíos | Ve el estado de sus envíos. | Muestra solo los envíos de ese vendedor. |
| Cotizador de rentabilidad (nuevo) | Carga el producto, las toneladas, su costo de manejo, el costo de disponer el residuo y el precio al que piensa vender. | Calcula el margen por tonelada, el ahorro por no disponer, el resultado mensual y anual, y el precio de equilibrio. Muestra el semáforo (verde / amarillo / rojo) y sugiere un precio. |
| Reporte de impacto | Descarga su reporte ambiental. | Muestra las toneladas desviadas de disposición final. |

## 3. Funcionalidades del transportista

| Funcionalidad | Qué hace el usuario | Qué hace el sistema |
|---|---|---|
| Registro y perfil | Se registra con el rol Transportista. | Habilita el mapa de cargas y rutas. |
| Mapa de cargas | Mira las cargas y los destinos, y hace clic en una línea para ver la ruta. | Dibuja origen → destino en SVG, con los puntos de cada ciudad. |
| Ranking de rutas | Revisa el ranking y elige una ruta. | Calcula el pago base más 15% de bonus de retorno, el total y los US$/km. Ordena por pago total. |
| Tomar carga | Pulsa Tomar carga. | Asigna la carga y notifica al comprador y al vendedor (simulado). |
| Consolidar | Pulsa Consolidar. | Busca otra carga para el mismo camión (simulado). |
| Ruta simple (nueva) | Elige un origen → destino. | Muestra el pago de la ruta y deja la vuelta vacía. Es la base de comparación. |
| Ruta ida y vuelta (nueva) | Elige una ruta con carga a la ida y a la vuelta. | Suma la carga de retorno, baja los km vacíos y muestra el pago mayor. |
| Ruta de 2 paradas (nueva) | Elige retirar en A, luego en B, y entregar en el destino. | Suma las toneladas de ambas cargas, calcula la ocupación del camión y muestra las paradas numeradas en el mapa. |
| Ruta de 2 paradas + vuelta (nueva) | Elige dos retiros, la entrega y una carga de retorno. | Calcula el pago total, que es el más alto de los cuatro tipos de ruta. |
| Comparador de rutas (nuevo) | Compara los tipos de ruta entre sí. | Muestra el pago, los US$/km, los km vacíos, el tiempo y la mejora porcentual frente a la ruta simple. |
| Armado automático (nuevo) | Pulsa Armar mi mejor ruta. | Busca cargas compatibles en el camino y propone la ruta más rentable. |
| Rutas de trueque | Toma la ruta que genera un trueque. | Ofrece ida y vuelta cargada como ruta premium. |

## Cómo hace BioNexo el matching

1. La IA convierte el texto libre en producto, toneladas, ciudad e intención (cerca, barato, trueque).
2. El backend filtra publicaciones por mismo producto.
3. Calcula score /100: 35% distancia, 30% precio, 20% disponibilidad, 15% calidad.
4. Suma km, costo, flete, total y CO2 del transporte. Marca PRIORIDAD 1.
5. Si el vendedor necesita algo que el comprador genera, marca TRUEQUE POSIBLE.
6. El comprador elige Comprar (5 pasos) o Proponer trueque (7 pasos con equivalencia y compensación en dinero).

Ejemplo **DATO SIMULADO**: Lote A US$760 contra Lote B US$420, diferencia US$340, orden doble con 2 fletes.


## Flujo integrado

1. Comprador se registra y carga requerimiento o usa el Agente IA.
2. Revisa dashboard, ordena por score y ve TRUEQUE POSIBLE si aplica.
3. Compra en 5 pasos o propone trueque en 7 pasos.
4. Vendedor publica, negocia por chat, acepta trueque, cotiza rentabilidad y sigue envíos.
5. Transportista toma la carga en mapa, compara ruta simple / ida y vuelta / 2 paradas / 2 paradas + vuelta, o usa armado automático.
6. Se cierra orden con flete asignado y reportes ambiental y de sostenibilidad.

## Alcance obligatorio del prototipo

- Registro por rol con pantallas habilitadas por rol.
- Filtro por producto y dashboard con score, flete, total y CO2.
- Circuito de compra en 5 pasos y trueque en 7 pasos con contrato de permuta.
- Agente IA con detección de intención y top 5.
- Cotizador de rentabilidad con semáforo y precio de equilibrio.
- Mapa SVG, ranking con bonus 15% retorno, 4 tipos de ruta, comparador y armado automático.
- Sostenibilidad ISO 14001 y reporte de impacto por toneladas desviadas.
- Todos los datos identificados como **DATO SIMULADO**.

## Fuera del recorrido principal

- Pagos reales.
- Contratos legalmente celebrados.
- Optimización logística avanzada con datos reales de flota.
- Certificación ambiental ISO auditada.
- Verificación automática de calidad.
- Marketplace nacional para todos los sectores.
- Blockchain o tokenización.
