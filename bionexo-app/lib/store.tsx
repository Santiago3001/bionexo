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

export interface ProfileInput {
  name: string;
  company: string;
  cuit: string;
  city: string;
  businessType: string;
}

const AUTH_COOKIE = "bionexo_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// La cookie la lee proxy.ts para la verificación optimista de rol en el servidor.
function escribirCookieSesion(role: Role, exp?: number) {
  if (typeof document === "undefined") return;
  const expiracion = exp ?? Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE;
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(JSON.stringify({ role, exp: expiracion }))}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

function borrarCookieSesion() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export interface OfferInput {
  product: string;
  category: string;
  originProcess: string;
  quantityTons: number;
  frequency: string;
  availabilityMonths: number;
  offerType: "spot" | "futuro";
  availableFrom: string;
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
  need: { product: string; t: number; city: string; requiredFrom?: string };
  sort: string;
  filterCity: string;
  pubs: Pub[];
  orders: Order[];
  truequeDone: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  setRole: (r: Role) => void;
  setNeed: (n: { product: string; t: number; city: string; requiredFrom?: string }) => void;
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
    ownerId: typeof row.owner_id === "string" ? row.owner_id : null,
    offerType: row.offer_type === "futuro" ? "futuro" : "spot",
    availableFrom: String(row.available_from ?? new Date().toISOString().slice(0, 10)),
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
    buyerId: typeof row.buyer_id === "string" ? row.buyer_id : null,
    sellerId: typeof row.seller_id === "string" ? row.seller_id : null,
    carrierId: typeof row.carrier_id === "string" ? row.carrier_id : null,
    contractId: typeof row.contract_id === "string" ? row.contract_id : null,
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
  const [need, setNeedState] = useState<{ product: string; t: number; city: string; requiredFrom?: string }>({ product: "Cascarilla de arroz", t: 20, city: "Resistencia", requiredFrom: "" });
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
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
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
    escribirCookieSesion(current.role);
    setNeedState((previous) => savedNeeds?.[0]
      ? {
          product: String(savedNeeds[0].product),
          t: Number(savedNeeds[0].quantity_tons),
          city: String(savedNeeds[0].delivery_city),
          requiredFrom: String(savedNeeds[0].required_from ?? ""),
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
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      // Esperamos a que el perfil quede en el store: si apagamos el loading
      // antes, Shell ve "sin usuario" y redirige al home en el camino.
      if (data.user) await loadUserData(data.user);
      if (active) setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        loadUserData(session.user).finally(() => {
          if (active) setAuthLoading(false);
        });
      } else {
        setUser(null);
        setOrders([]);
        setPubs(INITIAL_PUBS);
        setAuthLoading(false);
      }
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
    if (data.session) {
      const rolSesion = (data.session.user.user_metadata?.role as Role | undefined) ?? "comprador";
      escribirCookieSesion(rolSesion, data.session.expires_at ?? undefined);
    }
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
    borrarCookieSesion();
    setUser(null);
    setOrders([]);
    setTruequeFlag(false);
  }, []);

  const updateProfile = useCallback(async (input: ProfileInput): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return { ok: false, message: "Necesitás iniciar sesión." };

    const cambios = {
      full_name: input.name.trim(),
      company_name: input.company.trim(),
      cuit: input.cuit.trim(),
      city: input.city,
      business_type: input.businessType.trim(),
    };

    const { error } = await supabase.from("profiles").update(cambios).eq("id", user.id);
    if (error) return { ok: false, message: error.message };

    await supabase.auth.updateUser({ data: cambios });

    setUser((previous) => previous
      ? {
          ...previous,
          name: cambios.full_name,
          company: cambios.company_name,
          cuit: cambios.cuit,
          city: cambios.city,
          businessType: cambios.business_type,
        }
      : previous);

    return { ok: true, message: "Perfil actualizado." };
  }, [user]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { ok: false, message: "Supabase todavía no está configurado." };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Te enviamos un correo con el enlace para crear una contraseña nueva." };
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { ok: false, message: "Supabase todavía no está configurado." };
    if (newPassword.length < 8) return { ok: false, message: "La contraseña debe tener al menos 8 caracteres." };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Contraseña actualizada." };
  }, []);

  const setNeed = useCallback((nextNeed: { product: string; t: number; city: string; requiredFrom?: string }) => {
    setNeedState(nextNeed);
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user || user.role !== "comprador") return;
    void supabase.from("purchase_needs").insert({
      buyer_id: user.id,
      product: nextNeed.product,
      quantity_tons: nextNeed.t,
      delivery_city: nextNeed.city,
      required_from: nextNeed.requiredFrom || new Date().toISOString().slice(0, 10),
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
      offer_type: offer.offerType,
      available_from: offer.availableFrom || new Date().toISOString().slice(0, 10),
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
    updateProfile,
    resetPassword,
    updatePassword,
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
  }), [user, role, authLoading, dataLoading, need, sort, filterCity, pubs, orders, truequeDone, signIn, signUp, logout, updateProfile, resetPassword, updatePassword, setNeed, addOffer, addOrders, advanceOrder]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error("useStore fuera de StoreProvider");
  return store;
}

export { NEEDS };
