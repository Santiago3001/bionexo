-- Recalibra análisis históricos creados antes de corregir la unidad del factor
-- de transporte y de retirar el cálculo incompleto de almacenamiento en biochar.
-- No se borran registros: se conserva su trazabilidad y se marcan como históricos.

update public.carbon_analyses
set
  co2_stored = null,
  summary = 'Registro histórico recalibrado. El almacenamiento en biochar y las emisiones evitadas no se cuantifican sin rendimiento de proceso, análisis de laboratorio y línea base verificable.',
  destinations = coalesce(
    (
      select jsonb_agg(jsonb_set(item, '{almacenamiento}', 'null'::jsonb, true))
      from jsonb_array_elements(carbon_analyses.destinations) as item
    ),
    '[]'::jsonb
  )
where co2_stored is not null
   or summary ilike '%0,062 tCO2e/t·km%'
   or summary ilike '%almacenamiento teórico en biochar%';
