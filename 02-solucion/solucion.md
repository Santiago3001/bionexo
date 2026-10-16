# Solución

## Idea elegida

BioNexo NEA será, para la Ideathon, un asistente de descubrimiento comercial enfocado en cascarilla de arroz.

Una arrocera describe el material disponible en lenguaje natural. El sistema identifica los datos principales, consulta oportunidades existentes y recomienda compradores compatibles. Cada recomendación explica la coincidencia y muestra las condiciones pendientes de verificar.

La propuesta no reemplaza controles técnicos, contratos ni decisiones humanas.

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

## Alcance del prototipo

Incluye:

- Una consulta real a una API de IA.
- Entre 8 y 12 perfiles marcados como **DATO SIMULADO**.
- Publicaciones simuladas de oferta y demanda.
- Extracción de producto, cantidad, ubicación y frecuencia.
- Recomendaciones consultadas desde la base de datos.
- Explicación de la coincidencia.
- Una acción final demostrable, como preparar un contacto o borrador de consulta.

## Ideas descartadas para la primera versión

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

