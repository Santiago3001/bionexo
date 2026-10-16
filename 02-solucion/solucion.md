# Solución

## Idea elegida

BioNexo NEA será, para la Ideathon, un asistente de descubrimiento comercial enfocado en cascarilla de arroz.

Una arrocera describe el material disponible en lenguaje natural. El sistema identifica los datos principales, consulta oportunidades existentes y recomienda compradores compatibles. Cada recomendación explica la coincidencia y muestra las condiciones pendientes de verificar.

La propuesta no reemplaza controles técnicos, contratos ni decisiones humanas.

## Actores y usuarios

Una misma organización puede actuar como vendedora y compradora según la operación. Los roles describen lo que cada participante hace dentro de BioNexo.

### Oferentes o vendedores

Son quienes publican materiales, productos, excedentes, maquinaria o capacidad disponible.

Incluyen:

- Grandes empresas e industrias, como molinos, arroceras, aserraderos, fábricas y plantas procesadoras.
- Pequeños y medianos productores agropecuarios.
- Pequeños fabricantes, talleres y emprendimientos.
- Cooperativas y asociaciones que reúnen la oferta de varios miembros.
- Comercios y distribuidores.

Sus funciones principales son:

- Crear y mantener un perfil productivo.
- Publicar una oferta en forma manual o con asistencia de IA.
- Informar producto, cantidad, ubicación, frecuencia, precio y requisitos técnicos.
- Recibir recomendaciones de compradores y posibles aplicaciones.
- Comparar alternativas comerciales y logísticas.
- Negociar mediante el chat formal.
- Preparar acuerdos recurrentes y seguir las entregas.
-Consultar seguimiento de su venta

### Demandantes o compradores

Son industrias, fabricantes, productores, cooperativas, comercios o distribuidores que necesitan materias primas, insumos, subproductos, productos terminados, maquinaria o equipamiento.

Sus funciones principales son:

- Publicar una necesidad puntual o recurrente.
- Buscar proveedores mediante lenguaje natural.
- Comparar opciones por disponibilidad, ubicación, cantidad, precio y condiciones técnicas.
- Solicitar una cotización e iniciar una conversación comercial.
- Preparar pedidos y contratos de abastecimiento.
- Consultar seguimiento de su compra

### Transportistas

Incluye transportistas independientes y empresas logísticas.

Sus funciones principales son:

- Crear un perfil con vehículos, capacidad y zonas de cobertura.
- Informar rutas y disponibilidad.
- Recibir oportunidades de carga.
- Participar en viajes de retorno, cargas consolidadas y entregas recurrentes.
- Cotizar y dar seguimiento al transporte.

### Administrador de BioNexo

Es un actor operativo necesario para gestionar la plataforma. Este rol es un **SUPUESTO** porque el documento original no define todavía su funcionamiento detallado.

Sus funciones serían:

- Revisar perfiles, publicaciones y reportes.
- Gestionar permisos y accesos.
- Moderar contenido y atender incidentes.
- Mantener reglas de compatibilidad y datos de referencia.
- Controlar que los datos simulados estén identificados correctamente.

### Especialistas y terceros de verificación

Laboratorios, técnicos, certificadoras, aseguradoras y proveedores de pagos podrían intervenir en operaciones que necesiten validar calidad, identidad, seguridad o impacto ambiental.

No forman parte obligatoria del primer prototipo. Su participación y costos deben validarse antes de incorporarlos.

## Funcionalidades del producto

### 1. Registro y perfiles

- Registro de empresas, productores, cooperativas, compradores y transportistas.
- Perfiles con actividad, ubicación, capacidad y datos comerciales relevantes.
- Control de acceso según el rol de cada participante.

### 2. Publicación de ofertas y necesidades

- Carga de materias primas, insumos, subproductos, excedentes, productos, maquinaria y equipamiento.
- Publicaciones puntuales o recurrentes.
- Asistencia de IA para completar el formulario y solicitar los datos faltantes.

### 3. Búsqueda y descubrimiento mediante IA

- Búsqueda en lenguaje natural.
- Interpretación de producto, cantidad, frecuencia y ubicación.
- Recomendación de compradores y proveedores.
- Identificación de posibles aplicaciones alternativas de subproductos.
- Explicación de por qué una coincidencia puede ser conveniente.

La IA interpreta y presenta resultados. No debe inventar empresas, precios, productos ni condiciones técnicas.

### 4. Matching comercial

- Comparación de oferta y demanda.
- Evaluación de disponibilidad, ubicación, cantidad, precio y requisitos declarados.
- Listado ordenado de coincidencias.
- Identificación de datos técnicos pendientes de verificación.

### 5. Comparador logístico y económico

- Comparación de distancias, rutas, peso, volumen y costo estimado.
- Oportunidades de cargas consolidadas.
- Detección de viajes de retorno.
- Planificación de entregas recurrentes.

Los cálculos deben realizarse con módulos controlados y no mediante estimaciones inventadas por la IA.

### 6. Chat comercial formal

- Mensajes privados vinculados con una publicación, cotización, pedido o contrato.
- Historial persistente con remitente y fecha.
- Adjuntos, propuestas de precio y condiciones de entrega.
- Notificaciones de nuevos mensajes.
- Resumen de condiciones acordadas y confirmación de ambas partes.

El historial documenta la negociación, pero no reemplaza automáticamente un contrato formal.

### 7. Pedidos y contratos recurrentes

- Preparación de pedidos y cotizaciones.
- Borradores de acuerdos de 3, 6 o 12 meses.
- Definición de cantidad, precio, frecuencia, calidad, transporte y entrega.
- Calendarios, recordatorios y alertas ante posibles incumplimientos.

### 8. Seguimiento de operaciones

- Panel de pedidos, contratos y entregas.
- Registro del estado y cumplimiento de cada operación.
- Historial comercial organizado.
- Alertas y recordatorios.

### 9. Impacto ambiental

- Estimación inicial de emisiones asociadas al transporte.
- Comparación de alternativas logísticas.
- Reporte de Impacto BioNexo descargable en PDF.
- Reportes acumulados para operaciones recurrentes.

Los reportes son informativos y no certificaciones ambientales oficiales, salvo que se incorpore una verificación competente.

## Funcionalidad central

> Convertir una oferta escrita en lenguaje natural en una recomendación comercial explicada y accionable.

Ejemplo de entrada de la demo:

> “Tengo 20 toneladas mensuales de cascarilla de arroz disponibles en Corrientes”.

La cantidad, las empresas, los precios, las distancias y los resultados de esta demostración serán **DATO SIMULADO**.

## Flujo de usuario

1. La arrocera escribe qué tiene, cuánto, dónde y con qué frecuencia.
2. La IA extrae esos datos y pide únicamente la información indispensable que falte.
3. El backend consulta publicaciones y compradores cargados en la base.
4. Reglas controladas comparan ubicación, cantidad y requisitos declarados.
5. BioNexo muestra las mejores coincidencias, explica por qué y permite iniciar contacto.

Las acciones comerciales relevantes requieren confirmación humana.

## Alcance y prioridad del prototipo

### Recorrido central obligatorio

- Una consulta real a una API de IA.
- Entre 8 y 12 perfiles marcados como **DATO SIMULADO**.
- Publicaciones simuladas de oferta y demanda.
- Extracción de producto, cantidad, ubicación y frecuencia.
- Recomendaciones consultadas desde la base de datos.
- Explicación de la coincidencia.
- Una acción final demostrable, como preparar un contacto o borrador de consulta.

### Funciones complementarias para mostrar si el tiempo alcanza

- Registro y perfiles simulados.
- Publicación asistida de ofertas y necesidades.
- Comparador logístico y económico básico.
- Chat con mensajes guardados en la base de datos.
- Borrador demostrativo de contrato recurrente.
- Estimación ambiental informativa y reporte PDF.
- Panel simple de operaciones.

Estas funciones complementarias no deben debilitar el recorrido central: interpretar una necesidad, consultar datos y recomendar una oportunidad concreta.

## Funcionalidades postergadas o limitadas en la primera versión

### Marketplace para todo el NEA

Se descarta porque incorpora demasiados sectores, actores y tipos de producto antes de validar un caso concreto.

### Optimizador logístico completo

Se posterga porque exige tarifas, capacidades, restricciones y disponibilidad real de transportistas. La demo puede mostrar distancia y una estimación claramente identificada.

### Contratos recurrentes y pagos

Se postergan porque requieren definiciones comerciales, legales y financieras que no prueban la hipótesis principal.

### Reporte ambiental certificado

Se posterga porque un cálculo informativo no equivale a una certificación y necesita metodología y factores de emisión verificables.

### Blockchain y tokenización

Se descartan para el prototipo porque no mejoran el descubrimiento inicial de compradores.

### Chat comercial completo

Puede mostrarse como continuidad del flujo, pero no debe desplazar el esfuerzo de la recomendación central.

## Qué se va a probar

- Si la arrocera entiende cómo publicar su oferta.
- Si la información solicitada coincide con los datos disponibles en una operación real.
- Si la explicación de compatibilidad genera confianza.
- Si faltan variables técnicas esenciales.
- Si el usuario contactaría a la contraparte recomendada.
- Si pagaría por una conexión exitosa y bajo qué condición.

## Con quién se va a probar

- 5 responsables de arroceras. **SUPUESTO: meta inicial**.
- 5 compradores o usuarios industriales potenciales. **SUPUESTO: meta inicial**.
- 2 transportistas regionales. **SUPUESTO: meta inicial**.
- 1 especialista técnico que revise las variables de calidad. **SUPUESTO: meta inicial**.

La prueba debe usar casos reales anonimizados cuando sea posible. Si se usan ejemplos inventados, deben conservar la etiqueta **DATO SIMULADO**.

