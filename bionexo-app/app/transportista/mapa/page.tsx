"use client";
import MapaLeaflet from "@/components/MapaLeaflet";
import OperacionesTransportista from "@/components/OperacionesTransportista";
import { Shell } from "@/components/Shell";
export default function Page() { return <Shell><OperacionesTransportista /><MapaLeaflet /></Shell>; }
