import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DownloadPanel } from "@/components/item/download-panel";
import { ScreenshotGallery } from "@/components/item/gallery";
import { Container } from "@/components/layout/container";
import { ItemJsonLd } from "@/components/seo/item-jsonld";
import { Badge } from "@/components/ui-ext/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { getItemDetail, type ItemDetail } from "@/lib/items";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItemDetail(slug);

  if (!item) {
    return { title: "Item tidak ditemukan", robots: { index: false, follow: false } };
  }

  const title = item.seoTitle ?? item.title;
  const description = item.seoDescription ?? item.shortDescription;

  return {
    title,
    description,
    alternates: { canonical: `/source-code/${item.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/source-code/${item.slug}`,
      publishedTime: item.publishedAt?.toISOString(),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function Page({ params }: PageProps) {
  return (
    <Container className="py-8">
      <Suspense fallback={<DetailSkeleton />}>
        <ItemDetailContent params={params} />
      </Suspense>
    </Container>
  );
}

async function ItemDetailContent({ params }: PageProps) {
  const { slug } = await params;
  const item = await getItemDetail(slug);

  if (!item) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb title={item.title} />
      <ItemJsonLd item={item} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={item.type === "PREMIUM" ? "premium" : "free"}>
                {item.type === "PREMIUM" ? "Premium" : "Gratis"}
              </Badge>
              {item.category ? (
                <Link
                  href={`/source-code?kategori=${item.category.slug}`}
                  className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline focus-ring"
                >
                  {item.category.name}
                </Link>
              ) : null}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{item.title}</h1>

            <p className="max-w-prose text-base text-muted-foreground">
              {item.shortDescription}
            </p>

            <p className="text-xs text-muted-foreground">
              {item.publishedAt ? `Terbit ${formatDate(item.publishedAt)}` : null}
              {item.publishedAt && item.releasedAt ? " · " : null}
              {item.releasedAt ? `Rilis ${formatDate(item.releasedAt)}` : null}
            </p>
          </header>

          <ScreenshotGallery title={item.title} images={item.screenshots} />

          <OnThisPage item={item} />

          <Section id="deskripsi" title="Deskripsi">
            <Prose text={item.description} />
          </Section>

          {item.howItWorks ? (
            <Section id="cara-kerja" title="Cara kerja">
              <Prose text={item.howItWorks} />
            </Section>
          ) : null}

          {item.features.length > 0 ? (
            <Section id="fitur" title={`Fitur (${item.features.length})`}>
              <ol className="flex list-none flex-col gap-3">
                {item.features.map((feature, index) => (
                  <li key={feature.order} className="flex gap-3 text-base">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                    >
                      {index + 1}
                    </span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ol>
            </Section>
          ) : null}

          {item.steps.length > 0 ? (
            <Section id="instalasi" title="Instalasi">
              <ol className="flex list-none flex-col gap-6">
                {item.steps.map((step, index) => (
                  <li key={step.order} className="flex flex-col gap-2">
                    <h3 className="text-base font-semibold">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="max-w-prose whitespace-pre-line text-base text-muted-foreground">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </Section>
          ) : null}
        </div>

        <DownloadPanel item={item} />
      </div>
    </div>
  );
}

function Breadcrumb({ title }: { title: string }) {
  return (
    <nav aria-label="Remah roti">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="hover:text-foreground focus-ring">
            Beranda
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/source-code" className="hover:text-foreground focus-ring">
            Source code
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="truncate font-medium text-foreground">
          {title}
        </li>
      </ol>
    </nav>
  );
}

function OnThisPage({ item }: { item: ItemDetail }) {
  const links = [
    { href: "#deskripsi", label: "Deskripsi" },
    ...(item.howItWorks ? [{ href: "#cara-kerja", label: "Cara kerja" }] : []),
    ...(item.features.length > 0
      ? [{ href: "#fitur", label: `Fitur (${item.features.length})` }]
      : []),
    ...(item.steps.length > 0 ? [{ href: "#instalasi", label: "Instalasi" }] : []),
  ];

  return (
    <nav aria-label="Isi halaman" className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Isi halaman
      </p>
      <ul className="mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="underline-offset-4 hover:underline focus-ring">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-judul`} className="scroll-mt-24">
      <h2 id={`${id}-judul`} className="text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Prose({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter((paragraph) => paragraph.trim().length > 0);

  return (
    <div className="flex max-w-prose flex-col gap-4 text-base leading-relaxed">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <Skeleton className="h-4 w-64" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="aspect-[16/10] w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
