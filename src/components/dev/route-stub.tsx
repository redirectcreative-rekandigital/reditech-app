import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui-ext/badge";
import { Container } from "@/components/layout/container";

type RouteStubProps = {
  /** Layar di `05-ux-flows.md`, mis. `S02`. */
  screen?: string;
  title: string;
  description: string;
  /** ID requirement di `02-requirements.md`, mis. `FR-CAT-02..13`. */
  requirement?: string;
  /** Milestone tempat isi layar dikerjakan, mis. `M1`. */
  milestone: string;
  /** Kapabilitas RBAC yang menjaga rute ini (`09-superadmin-admin.md`). */
  capability?: string;
  /** Parameter dinamis yang sedang dirender, untuk memastikan tipe params benar. */
  params?: Record<string, string>;
  size?: "shell" | "wide";
};

/**
 * Kerangka rute M0. Setiap halaman sudah punya URL, metadata, dan kontrak
 * requirement; isi layarnya menyusul di milestone yang tercantum.
 * Komponen ini dihapus bertahap saat tiap layar selesai.
 */
export function RouteStub({
  screen,
  title,
  description,
  requirement,
  milestone,
  capability,
  params,
  size = "shell",
}: RouteStubProps) {
  const facts = [
    { label: "Layar", value: screen ?? "—" },
    { label: "Requirement", value: requirement ?? "—" },
    { label: "Milestone", value: milestone },
    { label: "Kapabilitas", value: capability ?? "publik" },
    ...(params
      ? Object.entries(params).map(([key, value]) => ({ label: `Param ${key}`, value }))
      : []),
  ];

  return (
    <Container size={size} className="py-10 sm:py-14">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">Kerangka M0</Badge>
        <Badge tone="free">{milestone}</Badge>
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-prose text-base text-muted-foreground">{description}</p>

      <Alert className="mt-8 max-w-prose">
        <AlertTitle>Struktur siap, isi menyusul</AlertTitle>
        <AlertDescription>
          Rute, metadata, dan kontrak datanya sudah ditetapkan. Komponen layar
          dikerjakan pada {milestone} sesuai `11-component-inventory.md`.
        </AlertDescription>
      </Alert>

      <dl className="mt-8 grid max-w-prose grid-cols-1 gap-x-8 gap-y-3 border-t border-border pt-6 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label} className="flex items-baseline justify-between gap-4 sm:block">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {fact.label}
            </dt>
            <dd className="font-mono text-[13px] break-all">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </Container>
  );
}
