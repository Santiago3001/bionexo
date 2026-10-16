import { Shell } from "@/components/Shell";
import ChatComercial from "@/components/ChatComercial";

// El hilo se resuelve en el cliente (sesión de Supabase + realtime),
// así que la ruta se bloquea en el request en lugar de pre-renderizarse.
export const instant = false;

export default async function MensajePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Shell>
      <ChatComercial conversationId={id} />
    </Shell>
  );
}
