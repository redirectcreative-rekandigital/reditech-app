/**
 * Kapabilitas admin (`09-superadmin-admin.md` §2). Satu-satunya cara memeriksa
 * izin adalah `can(actor, capability)`; kode fitur tidak pernah membandingkan
 * nama peran. SUPERADMIN selalu lolos.
 */
export const CAPABILITIES = [
  "item:read",
  "item:write",
  "item:publish",
  "item:delete",
  "taxonomy:read",
  "taxonomy:write",
  "taxonomy:delete",
  "tutorial:read",
  "tutorial:write",
  "tutorial:publish",
  "tutorial:delete",
  "sponsor:read",
  "sponsor:moderate",
  "sponsor:delete",
  "request:read",
  "request:write",
  "request:delete",
  "media:read",
  "media:write",
  "media:delete",
  "order:read",
  "order:refund",
  "entitlement:grant",
  "entitlement:revoke",
  "download:read",
  "user:read",
  "user:suspend",
  "user:role:manage",
  "setting:read",
  "setting:update",
  "audit:read",
  "audit:export",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export type AdminRole = "VISITOR" | "USER" | "ADMIN" | "SUPERADMIN";

export type CapabilityActor = {
  id: string;
  email: string;
  role: AdminRole;
  permissions: readonly string[];
};

/** Cukup peran + daftar izin — dipakai proxy yang tidak memuat aktor penuh. */
export type CapabilitySubject = {
  role: AdminRole;
  permissions: readonly string[];
};

const CAPABILITY_SET = new Set<string>(CAPABILITIES);

export function isCapability(value: string): value is Capability {
  return CAPABILITY_SET.has(value);
}

/** Hanya kapabilitas yang dikenal yang disimpan; input asing dibuang. */
export function normalizePermissions(values: readonly string[]): Capability[] {
  return [...new Set(values.filter(isCapability))];
}

export function isAdminRole(role: AdminRole): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function can(actor: CapabilityActor | null, capability: Capability): boolean {
  if (!actor) return false;
  return hasCapability(actor, capability);
}

/**
 * Versi tanpa identitas aktor, untuk proxy: proxy hanya perlu tahu peran dan
 * daftar kapabilitas, dan tidak boleh mengimpor modul `next/headers`.
 */
export function hasCapability(
  subject: CapabilitySubject | null,
  capability: Capability,
): boolean {
  if (!subject) return false;
  if (subject.role === "SUPERADMIN") return true;
  if (subject.role !== "ADMIN") return false;

  return subject.permissions.includes(capability);
}

export function capabilitiesOf(actor: CapabilityActor | null): Capability[] {
  if (!actor) return [];
  if (actor.role === "SUPERADMIN") return [...CAPABILITIES];
  return normalizePermissions(actor.permissions);
}

/** Bundel siap pakai (`09-superadmin-admin.md` §2.2). */
export const BUNDLES = {
  editor: [
    "item:read",
    "item:write",
    "taxonomy:read",
    "taxonomy:write",
    "tutorial:read",
    "tutorial:write",
    "media:read",
    "media:write",
    "sponsor:read",
    "request:read",
    "request:write",
    "order:read",
    "audit:read",
  ],
  publisher: [
    "item:read",
    "item:write",
    "item:publish",
    "taxonomy:read",
    "taxonomy:write",
    "tutorial:read",
    "tutorial:write",
    "tutorial:publish",
    "media:read",
    "media:write",
    "sponsor:read",
    "sponsor:moderate",
    "request:read",
    "request:write",
    "order:read",
    "audit:read",
  ],
  commerce: ["order:read", "order:refund", "entitlement:grant", "entitlement:revoke", "download:read"],
  userAdmin: ["user:read", "user:suspend"],
} as const satisfies Record<string, readonly Capability[]>;

export type BundleName = keyof typeof BUNDLES;

export const BUNDLE_LABELS: Record<BundleName, string> = {
  editor: "Editor",
  publisher: "Publisher",
  commerce: "Commerce Ops",
  userAdmin: "User Admin",
};

/** Grup untuk tampilan matriks izin di panel pengguna. */
export const CAPABILITY_GROUPS: Array<{ title: string; items: Capability[] }> = [
  { title: "Item", items: ["item:read", "item:write", "item:publish", "item:delete"] },
  { title: "Taksonomi", items: ["taxonomy:read", "taxonomy:write", "taxonomy:delete"] },
  {
    title: "Tutorial",
    items: ["tutorial:read", "tutorial:write", "tutorial:publish", "tutorial:delete"],
  },
  { title: "Sponsor", items: ["sponsor:read", "sponsor:moderate", "sponsor:delete"] },
  { title: "Request", items: ["request:read", "request:write", "request:delete"] },
  { title: "Media", items: ["media:read", "media:write", "media:delete"] },
  {
    title: "Perdagangan",
    items: ["order:read", "order:refund", "entitlement:grant", "entitlement:revoke"],
  },
  { title: "Unduhan", items: ["download:read"] },
  { title: "Pengguna", items: ["user:read", "user:suspend", "user:role:manage"] },
  { title: "Pengaturan", items: ["setting:read", "setting:update"] },
  { title: "Audit", items: ["audit:read", "audit:export"] },
];
