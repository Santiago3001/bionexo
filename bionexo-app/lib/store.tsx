"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { INITIAL_PUBS, NEEDS, Order, Pub } from "./data";

export type Role = "comprador" | "vendedor" | "transportista";

export interface User {
  name: string;
  company: string;
  city: string;
  cuit: string;
}

interface Store {
  user: User | null;
  role: Role;
  need: { product: string; t: number; city: string };
  sort: string;
  filterCity: string;
  pubs: Pub[];
  orders: Order[];
  truequeDone: boolean;
  login: (u: User) => void;
  logout: () => void;
  setRole: (r: Role) => void;
  setNeed: (n: { product: string; t: number; city: string }) => void;
  setSort: (s: string) => void;
  setFilterCity: (c: string) => void;
  addPub: (p: Pub) => void;
  addOrders: (o: Order[]) => void;
  advanceOrder: (id: string) => void;
  setTruequeDone: () => void;
  myPubs: Pub[];
}

const Ctx = createContext<Store | null>(null);

function seedOrders(company: string, city: string): Order[] {
  return [
    { id: "OC-1042", kind: "compra", product: "Aserrín de pino", t: 15, from: "Oberá", to: city, buyer: company, seller: "Aserradero Litoral", carrier: "Transporte Ávila SRL", st: 2, eta: "2 días", value: 630 },
    { id: "OV-2087", kind: "venta", product: "Aserrín de pino", t: 10, from: city, to: "Corrientes", buyer: "Cementos del Litoral SA", seller: company, carrier: "Transporte NEA Cargas", st: 1, eta: "3 días", value: 410 },
  ];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>("comprador");
  const [need, setNeed] = useState({ product: "Cascarilla de arroz", t: 20, city: "Resistencia" });
  const [sort, setSort] = useState("score");
  const [filterCity, setFilterCity] = useState("");
  const [pubs, setPubs] = useState<Pub[]>(INITIAL_PUBS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [truequeDone, setTruequeFlag] = useState(false);

  const value: Store = useMemo(() => ({
    user, role, need, sort, filterCity, pubs, orders, truequeDone,
    login: (u) => {
      setUser(u);
      setRoleState("comprador");
      setNeed((n) => ({ ...n, city: u.city }));
      setOrders(seedOrders(u.company, u.city));
    },
    logout: () => { setUser(null); setOrders([]); setTruequeFlag(false); },
    setRole: (r) => setRoleState(r),
    setNeed, setSort, setFilterCity,
    addPub: (p) => setPubs((prev) => [...prev, p]),
    addOrders: (o) => setOrders((prev) => [...prev, ...o]),
    advanceOrder: (id) => setOrders((prev) => prev.map((o) => (o.id === id && o.st < 4 ? { ...o, st: o.st + 1 } : o))),
    setTruequeDone: () => setTruequeFlag(true),
    myPubs: pubs.filter((p) => user && p.seller === user.company),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, role, need, sort, filterCity, pubs, orders, truequeDone]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore fuera de provider");
  return s;
}

export { NEEDS };
