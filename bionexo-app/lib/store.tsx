"use client";

import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { INITIAL_PUBS, NEEDS, type Order, type Pub } from "./data";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "./supabase/client";

export type Role = "comprador" | "vendedor" | "transportista";

export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  city: string;
  cuit: string;
  businessType: string;
  role: Role;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  company: string;
  city: string;
  cuit: string;
  businessType: string;
  role: Role;
}

export interface OfferInput {
  product: string;
  category: string;
  originProcess: string;
  quantityTons: number;
  frequency: string;
  availabilityMonths: number;
  city: string;
  presentation: string;
  qualityNotes: string;
  pricePerTon: number;
  minLotTons: number;
  pickupTerms: string;
  loadingMethod: string;
  storageRestrictions: string;
  documentsNotes: string;
}

interface AuthResult {
  ok: boolean;
  message: string;
  requiresEmailConfirmation?: boolean;
}

interface Store {
  user: User | null;
  role: Role;
  authLoading: boolean;
  dataLoading: boolean;
  authConfigured: boolean;
  need: { product: string; t: number; city: string };
  sort: string;
  filterCity: string;
  pubs: Pub[];
  orders: Order[];
  truequeDone: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  setRole: (r: Role) => void;
  setNeed: (n: { product: string; t: number; city: string }) => void;
  setSort: (s: string) => void;
  setFilterCity: (c: string) => void;
  addOffer: (offer: OfferInput) => Promise<AuthResult>;
  addPub: (p: Pub) => void;
  addOrders: (o: Order[]) => void;
  advanceOrder: (id: string) => void;
  setTruequeDone: () => void;
  myPubs: Pub[];
}

const Ctx = createContext<Store | null>(null);

function profileFromMetadata(authUser: SupabaseAuthUser): User {
  const metadata = authUser.user_metadata ?? {};
  const role = ["comprador", "vendedor", "transportista"].includes(metadata.role)
    ? (metadata.role as Role)
    : "comprador";
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    name: metadata.full_name ?? "Usuario BioNexo",
    company: metadata.company_name ?? "Empresa sin completar",
    city: metadata.city ?? "Resistencia",
    cuit: metadata.cuit ?? "",
    businessType: metadata.business_type ?? "",
    role,
  };
}

function pubFromRow(row: Record<string, unknown>): Pub {
  return {
    id: Number(row.id),
    seller: String(row.seller_name),
    product: String(row.product),
    city: String(row.city) as Pub["city"],
    t: Number(row.quantity_tons),
    price: Number(row.price_per_ton),
    q: Number(row.quality_score ?? 7),
    category: String(row.category ?? ""),
    originProcess: String(row.origin_process ?? ""),
    frequency: String(row.frequency ?? "Mensual"),
    availabilityMonths: Number(row.availability_months ?? 1),
    presentation: String(row.presentation ?? ""),
    qualityNotes: String(row.quality_notes ?? ""),
    minLotTons: Number(row.min_lot_tons ?? 1),
    pickupTerms: String(row.pickup_terms ?? ""),
    loadingMethod: String(row.loading_method ?? ""),
    storageRestrictions: String(row.storage_restrictions ?? ""),
    documentsNotes: String(row.documents_notes ?? ""),
    simulated: Boolean(row.is_simulated),
  };
}

function orderFromRow(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    kind: String(row.kind) as Order["kind"],
    product: String(row.product),
    t: Number(row.quantity_tons),
    from: String(row.origin_city),
    to: String(row.destination_city),
    buyer: String(row.buyer_name),
    seller: String(row.seller_name),
    carrier: String(row.carrier_name ?? ""),
    st: Number(row.status_step),
    eta: String(row.eta ?? ""),
    value: Number(row.value_usd),
  };
}

export function homeForRole(role: Role): string {
  if (role === "vendedor") return "/vendedor/publicaciones";
  if (role === "transportista") return "/transportista/mapa";
  return "/comprador/requerimiento";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>("comprador");
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured());
  const [dataLoading, setDataLoading] = useState(false);
  const [need, setNeedState] = useState({ product: "Cascarilla de arroz", t: 20, city: "Resistencia" });
  const [sort, setSort] = useState("score");
  const [filterCity, setFilterCity] = useState("");
  const [pubs, setPubs] = useState<Pub[]>(INITIAL_PUBS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [truequeDone, setTruequeFlag] = useState(false);

  const loadUserData = useCallback(async (authUser: SupabaseAuthUser) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setDataLoading(true);

    const fallback = profileFromMetadata(authUser);
    const [{ data: profile }, { data: offers }, { data: savedOrders }, { data: savedNeeds }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
      supabase.from("offers").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("created_by", authUser.id).order("created_at", { ascending: false }),
      supabase.from("purchase_needs").select("*").eq("buyer_id", authUser.id).eq("status", "active").order("created_at", { ascending: false }).limit(1),
    ]);

    const current: User = profile
      ? {
          id: authUser.id,
          email: String(profile.email ?? fallback.email),
          name: String(profile.full_name ?? fallback.name),
          company: String(profile.company_name ?? fallback.company),
          city: String(profile.city ?? fallback.city),
          cuit: String(profile.cuit ?? fallback.cuit),
          businessType: String(profile.business_type ?? fallback.businessType),
          role: String(profile.role ?? fallback.role) as Role,
        }
      : fallback;

    setUser(current);
    setRoleState(current.role);
    setNeedState((previous) => savedNeeds?.[0]
      ? {
          product: String(savedNeeds[0].product),
          t: Number(savedNeeds[0].quantity_tons),
          city: String(savedNeeds[0].delivery_city),
        }
      : { ...previous, city: current.city });
    setPubs(offers?.length ? offers.map((row) => pubFromRow(row as Record<string, unknown>)) : INITIAL_PUBS);
    setOrders(savedOrders?.map((row) => orderFromRow(row as Record<string, unknown>)) ?? []);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) void loadUserData(data.user);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        window.setTimeout(() => void loadUserData(session.user), 0);
      } else {
        setUser(null);
        setOrders([]);
        setPubs(INITIAL_PUBS);
      }
      setAuthLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { ok: false, message: "Supabase todavía no está configurado." };
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, message: error.message };
    if (data.user) await loadUserData(data.user);
    return { ok: true, message: "Sesión iniciada." };
  }, [loadUserData]);

  const signUp = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { ok: false, message: "Supabase todavía no está configurado." };
    if (input.password.length < 8) return { ok: false, message: "La contraseña debe tener al menos 8 caracteres." };

    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          full_name: input.name.trim(),
          company_name: input.company.trim(),
          city: input.city,
          cuit: input.cuit.trim(),
          business_type: input.businessType.trim(),
          role: input.role,
        },
      },
    });
    if (error) return { ok: false, message: error.message };
    if (data.session && data.user) {
      await loadUserData(data.user);
      return { ok: true, message: "Cuenta creada y sesión iniciada." };
    }
    return {
      ok: true,
      message: "Cuenta creada. Revisá tu correo para confirmar el acceso.",
      requiresEmailConfirmation: true,
    };
  }, [loadUserData]);

  const logout = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setOrders([]);
    setTruequeFlag(false);
  }, []);

  const setNeed = useCallback((nextNeed: { product: string; t: number; city: string }) => {
    setNeedState(nextNeed);
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user || user.role !== "comprador") return;
    void supabase.from("purchase_needs").insert({
      buyer_id: user.id,
      product: nextNeed.product,
      quantity_tons: nextNeed.t,
      delivery_city: nextNeed.city,
      frequency: "Mensual",
      duration_months: 12,
      max_radius_km: 150,
      status: "active",
    });
  }, [user]);

  const addOffer = useCallback(async (offer: OfferInput): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return { ok: false, message: "Necesitás iniciar sesión." };
    if (user.role !== "vendedor") return { ok: false, message: "Solo un vendedor puede publicar ofertas." };

    const { data, error } = await supabase.from("offers").insert({
      owner_id: user.id,
      seller_name: user.company,
      product: offer.product,
      category: offer.category,
      origin_process: offer.originProcess,
      quantity_tons: offer.quantityTons,
      frequency: offer.frequency,
      availability_months: offer.availabilityMonths,
      city: offer.city,
      presentation: offer.presentation,
      quality_notes: offer.qualityNotes,
      price_per_ton: offer.pricePerTon,
      min_lot_tons: offer.minLotTons,
      pickup_terms: offer.pickupTerms,
      loading_method: offer.loadingMethod,
      storage_restrictions: offer.storageRestrictions,
      documents_notes: offer.documentsNotes,
      quality_score: 7,
      status: "active",
    }).select("*").single();
    if (error) return { ok: false, message: error.message };
    setPubs((previous) => [pubFromRow(data as Record<string, unknown>), ...previous]);
    return { ok: true, message: "Oferta publicada y disponible para el matching." };
  }, [user]);

  const addOrders = useCallback((newOrders: Order[]) => {
    setOrders((previous) => [...newOrders, ...previous]);
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;
    void supabase.from("orders").insert(newOrders.map((order) => ({
      id: order.id,
      created_by: user.id,
      kind: order.kind,
      product: order.product,
      quantity_tons: order.t,
      origin_city: order.from,
      destination_city: order.to,
      buyer_name: order.buyer,
      seller_name: order.seller,
      carrier_name: order.carrier,
      status_step: order.st,
      eta: order.eta,
      value_usd: order.value,
    })));
  }, [user]);

  const advanceOrder = useCallback((id: string) => {
    setOrders((previous) => previous.map((order) => {
      if (order.id !== id || order.st >= 4) return order;
      const next = { ...order, st: order.st + 1 };
      const supabase = getSupabaseBrowserClient();
      if (supabase && user) void supabase.from("orders").update({ status_step: next.st }).eq("id", id).eq("created_by", user.id);
      return next;
    }));
  }, [user]);

  const value: Store = useMemo(() => ({
    user,
    role,
    authLoading,
    dataLoading,
    authConfigured: isSupabaseConfigured(),
    need,
    sort,
    filterCity,
    pubs,
    orders,
    truequeDone,
    signIn,
    signUp,
    logout,
    setRole: setRoleState,
    setNeed,
    setSort,
    setFilterCity,
    addOffer,
    addPub: (publication) => setPubs((previous) => [publication, ...previous]),
    addOrders,
    advanceOrder,
    setTruequeDone: () => setTruequeFlag(true),
    myPubs: pubs.filter((publication) => user && publication.seller === user.company),
  }), [user, role, authLoading, dataLoading, need, sort, filterCity, pubs, orders, truequeDone, signIn, signUp, logout, setNeed, addOffer, addOrders, advanceOrder]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error("useStore fuera de StoreProvider");
  return store;
}

export { NEEDS };
