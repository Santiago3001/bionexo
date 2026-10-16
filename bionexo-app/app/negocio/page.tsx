import { Shell } from "@/components/Shell";
import { Card, Muted, Tag } from "@/components/ui";

export default function Negocio() {
  return (
    <Shell>
      <Card>
        <Tag>Proyección para el pitch</Tag>
        <h2 style={{ margin: "8px 0 6px" }}>Modelo de negocio</h2>
        <Muted>Vista resumida para la demo. Números simulados.</Muted>
      </Card>
      <Card>
        <h3 style={{ marginTop: 0 }}>Cómo gana BioNexo</h3>
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
          <li>Comisión por operación cerrada entre empresa y contraparte.</li>
          <li>Coordinación logística: prioriza retorno cargado y rutas consolidadas.</li>
          <li>Servicios empresa: reportes de impacto y sostenibilidad.</li>
        </ul>
      </Card>
      <Card>
        <h3 style={{ marginTop: 0 }}>Proyección (12 meses, simulada)</h3>
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
          <li>Operaciones recurrentes de cascarilla y subproductos regionales.</li>
          <li>Menos km vacíos del transportista con mapa y comparador de rutas.</li>
          <li>Trueques que evitan disposición final y suman a ISO 14001.</li>
        </ul>
      </Card>
    </Shell>
  );
}
