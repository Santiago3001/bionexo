"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { CIUDADES, NOMBRES, TRAMO_META, etiquetaCorta, type Combo, type Tramo } from "@/lib/rutas";

export type TramoCoords = [number, number][];

export interface TramoDibujo {
  tipo: Tramo;
  coords: TramoCoords; // [lng, lat] como en lib/rutas
}

/** Cambiá el fondo con una línea: "osm" (callejero real) | "carto" (claro minimal) | "esri" (satélite). */
export type Fondo = "osm" | "carto" | "esri";

const FONDOS: Record<Fondo, { url: string; attribution: string }> = {
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  carto: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  esri: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
  },
};

export const FONDO_ACTIVO: Fondo = "osm";

const toLatLng = (c: [number, number]): [number, number] => [c[1], c[0]];

function Encuadre({ sel }: { sel: Combo }) {
  const map = useMap();
  useEffect(() => {
    const unicas = sel.paradas.filter((p, i) => !(i === sel.paradas.length - 1 && p === sel.paradas[0]));
    const bounds = L.latLngBounds(unicas.map((p) => toLatLng(CIUDADES[p])));
    const desktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    map.flyToBounds(bounds, {
      paddingTopLeft: desktop ? L.point(90, 90) : L.point(40, 40),
      paddingBottomRight: desktop ? L.point(460, 90) : L.point(40, 340),
      maxZoom: 9,
      duration: 0.9,
    });
  }, [map, sel]);
  return null;
}

function pinIcon(nombre: string, etiqueta: string, esBase: boolean): L.DivIcon {
  return L.divIcon({
    className: "bn-pin",
    html:
      `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">` +
      `<div style="display:grid;place-items:center;width:32px;height:32px;border-radius:9999px;` +
      `border:3px solid #fff;font-size:12px;font-weight:800;color:#fff;` +
      `background:${esBase ? "#1e293b" : "#16a34a"};box-shadow:0 4px 10px rgba(0,0,0,.35)" title="${nombre}">${etiqueta}</div>` +
      `<span style="white-space:nowrap;background:rgba(255,255,255,.95);border-radius:6px;padding:1px 6px;` +
      `font-size:11px;font-weight:600;color:#334155;box-shadow:0 1px 4px rgba(0,0,0,.25)">${nombre}</span></div>`,
    iconSize: [64, 62],
    iconAnchor: [32, 18],
  });
}

export default function MapaLeafletInner({
  sel,
  tramos,
  foco,
}: {
  sel: Combo;
  tramos: TramoDibujo[];
  foco: number | null;
}) {
  const fondo = FONDOS[FONDO_ACTIVO];

  const paradas = useMemo(() => {
    const unicas = sel.paradas.filter((p, i) => !(i === sel.paradas.length - 1 && p === sel.paradas[0]));
    return unicas.map((p, i) => ({
      clave: p,
      pos: toLatLng(CIUDADES[p]),
      icon: pinIcon(NOMBRES[p] ?? p, i === 0 ? "B" : String(i), i === 0),
    }));
  }, [sel]);

  return (
    <MapContainer
      center={[-27.6, -58.4]}
      zoom={7}
      zoomControl={false}
      attributionControl
      className="h-full w-full"
      style={{ background: "#aad3df" }}
    >
      <TileLayer url={fondo.url} attribution={fondo.attribution} maxZoom={19} />
      <ZoomControl position="bottomright" />
      <Encuadre sel={sel} />

      {tramos.map((t, i) => {
        const meta = TRAMO_META[t.tipo];
        const atenuado = foco !== null && foco !== i;
        const linea = t.coords.map(toLatLng);
        const ancho = meta.ancho;
        return (
          <Polyline key={`${sel.id}-${i}`} positions={linea} pathOptions={{ color: "#ffffff", weight: ancho + 4, opacity: atenuado ? 0.15 : 0.95, lineCap: "round", lineJoin: "round" }} />
        );
      })}
      {tramos.map((t, i) => {
        const meta = TRAMO_META[t.tipo];
        const atenuado = foco !== null && foco !== i;
        const linea = t.coords.map(toLatLng);
        return (
          <Polyline
            key={`${sel.id}-${i}-c`}
            positions={linea}
            pathOptions={{
              color: meta.color,
              weight: meta.ancho,
              opacity: atenuado ? 0.2 : 1,
              lineCap: "round",
              lineJoin: "round",
              dashArray: t.tipo === "vacio" ? "5 9" : undefined,
            }}
          />
        );
      })}

      {paradas.map((m) => (
        <Marker key={m.clave} position={m.pos} icon={m.icon} title={etiquetaCorta(m.clave)} />
      ))}
    </MapContainer>
  );
}
