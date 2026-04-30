"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type LineItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
};

type ParsedTicket = {
  seriesNumber: string;
  issueDate: string;
  issueTime: string;
  issuerRuc: string;
  issuerName: string;
  customerName: string;
  customerDocument: string;
  customerDocumentType: string;
  currency: string;
  subtotal: string;
  discount: string;
  total: string;
  items: LineItem[];
};

type ThemeMode = "light" | "dark";

const fallbackTicket: ParsedTicket = {
  seriesNumber: "—",
  issueDate: "—",
  issueTime: "—",
  issuerRuc: "—",
  issuerName: "Tu emprendimiento",
  customerName: "Cliente final",
  customerDocument: "Sin documento",
  customerDocumentType: "—",
  currency: "PEN",
  subtotal: "0.00",
  discount: "0.00",
  total: "0.00",
  items: [],
};

function textAt(root: Element | Document | null, selectors: string[]) {
  if (!root) return "";
  for (const selector of selectors) {
    const el = root.querySelector(selector);
    const value = el?.textContent?.trim();
    if (value) return value;
  }
  return "";
}

function cleanValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-" || trimmed === "—") return "";
  return trimmed;
}

function formatMoney(value: string) {
  const numeric = Number.parseFloat(value.replace(/,/g, ""));
  if (Number.isNaN(numeric)) return value || "0.00";
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function normalizePdfText(value: string) {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

function extractRucFromFilename(fileName: string) {
  const match = fileName.match(/\b(\d{11})\b/);
  return match?.[1] ?? "";
}

function parseXmlToTicket(xmlText: string, fileName = ""): ParsedTicket {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError)
    throw new Error(
      "El XML no se pudo leer. Verifica que el archivo sea válido.",
    );

  const seriesNumber = textAt(doc, ["cbc\\:ID", "ID"]) || "—";
  const issueDate = textAt(doc, ["cbc\\:IssueDate", "IssueDate"]);
  const issueTime = textAt(doc, ["cbc\\:IssueTime", "IssueTime"]);
  const issuerRuc = textAt(doc, [
    "cac\\:AccountingSupplierParty cbc\\:ID",
    "AccountingSupplierParty ID",
  ]);
  const issuerName = textAt(doc, [
    "cac\\:AccountingSupplierParty cbc\\:RegistrationName",
    "AccountingSupplierParty RegistrationName",
  ]);
  const customerName =
    textAt(doc, [
      "cac\\:AccountingCustomerParty cbc\\:RegistrationName",
      "AccountingCustomerParty RegistrationName",
    ]) || "Cliente final";
  const customerDocument = textAt(doc, [
    "cac\\:AccountingCustomerParty cbc\\:ID",
    "AccountingCustomerParty ID",
  ]);
  const customerDocumentType = textAt(doc, [
    "cac\\:AccountingCustomerParty cbc\\:ID",
  ]);
  const currency =
    textAt(doc, ["cbc\\:DocumentCurrencyCode", "DocumentCurrencyCode"]) ||
    "PEN";
  const subtotal =
    textAt(doc, [
      "cac\\:LegalMonetaryTotal cbc\\:LineExtensionAmount",
      "LegalMonetaryTotal LineExtensionAmount",
    ]) || "0.00";
  const discount =
    textAt(doc, [
      "cac\\:LegalMonetaryTotal cbc\\:AllowanceTotalAmount",
      "LegalMonetaryTotal AllowanceTotalAmount",
    ]) || "0.00";
  const total =
    textAt(doc, [
      "cac\\:LegalMonetaryTotal cbc\\:PayableAmount",
      "LegalMonetaryTotal PayableAmount",
    ]) || "0.00";

  const lines = Array.from(
    doc.querySelectorAll("cac\\:InvoiceLine, InvoiceLine"),
  ).map((line, index) => {
    const description =
      textAt(line, ["cac\\:Item cbc\\:Description", "Item Description"]) ||
      `Ítem ${index + 1}`;
    const quantity =
      textAt(line, ["cbc\\:InvoicedQuantity", "InvoicedQuantity"]) || "1.00";
    const unitPrice =
      textAt(line, [
        "cac\\:Price cbc\\:PriceAmount",
        "Price PriceAmount",
        "cac\\:PricingReference cbc\\:PriceAmount",
        "PricingReference PriceAmount",
      ]) || "0.00";
    const totalAmount =
      textAt(line, ["cbc\\:LineExtensionAmount", "LineExtensionAmount"]) ||
      unitPrice;

    return {
      id: textAt(line, ["cbc\\:ID", "ID"]) || String(index + 1),
      description,
      quantity,
      unitPrice,
      total: totalAmount,
    };
  });

  const normalizedCustomerDocument = cleanValue(customerDocument);

  return {
    seriesNumber,
    issueDate: issueDate || "—",
    issueTime: issueTime || "—",
    issuerRuc: issuerRuc || "—",
    issuerName: issuerName || "—",
    customerName: customerName || "Cliente final",
    customerDocument: normalizedCustomerDocument || "Sin documento",
    customerDocumentType: normalizedCustomerDocument
      ? customerDocumentType || "DNI/RUC"
      : "Sin documento",
    currency,
    subtotal,
    discount,
    total,
    items: lines,
  };
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [businessName, setBusinessName] = useState("Mi emprendimiento");
  const [ruc, setRuc] = useState("");
  const [rucSource, setRucSource] = useState("Manual");
  const [subtitle, setSubtitle] = useState("Suplementos deportivos");
  const [logo, setLogo] = useState<string | null>(null);
  const [ticket, setTicket] = useState<ParsedTicket>(fallbackTicket);
  const [status, setStatus] = useState(
    "Sube tu XML para generar un ticket limpio en segundos.",
  );
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const printableDate = useMemo(() => {
    if (ticket.issueDate === "—") return "Pendiente";
    return `${ticket.issueDate}${ticket.issueTime !== "—" ? ` ${ticket.issueTime}` : ""}`;
  }, [ticket.issueDate, ticket.issueTime]);

  useEffect(() => {
    const stored = window.localStorage.getItem(
      "ezcomprobante-theme",
    ) as ThemeMode | null;
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const nextTheme = stored ?? (systemPrefersDark ? "dark" : "light");
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    window.localStorage.setItem("ezcomprobante-theme", theme);
  }, [theme]);

  function handleLogoUpload(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function handleXmlUpload(file: File | null) {
    if (!file) return;
    setError("");
    setStatus("Leyendo XML localmente…");

    const xmlText = await file.text();
    const parsed = parseXmlToTicket(xmlText, file.name);
    const fileRuc = extractRucFromFilename(file.name);
    const detectedRuc =
      parsed.issuerRuc !== "—" && parsed.issuerRuc !== ""
        ? parsed.issuerRuc
        : fileRuc;
    if (detectedRuc) {
      setRuc(detectedRuc);
      setRucSource(
        fileRuc && fileRuc === detectedRuc ? "Nombre del XML" : "XML",
      );
    }
    setTicket(parsed);
    setIsReady(true);
    setStatus("Ticket generado. El XML no se guarda y se limpia al terminar.");

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGeneratePdf() {
    const { jsPDF } = await import("jspdf");
    const clientFirstName = ticket.customerName.trim().split(/\s+/)[0] || "cliente";
    const estimatedHeight = 150 + ticket.items.length * 16;
    const pdf = new jsPDF({
      unit: "mm",
      format: [90, Math.max(220, estimatedHeight)],
      orientation: "portrait",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 8;
    const contentWidth = pageWidth - marginX * 2;
    let y = 12;

    const addText = (
      text: string,
      x: number,
      size: number,
      opts: { bold?: boolean; align?: "left" | "right" } = {},
    ) => {
      pdf.setFont("helvetica", opts.bold ? "bold" : "normal");
      pdf.setFontSize(size);
      pdf.text(normalizePdfText(text), x, y, {
        align: opts.align ?? "left",
        maxWidth: contentWidth,
      });
    };

    const addLine = (gapTop = 3, gapBottom = 5) => {
      y += gapTop;
      pdf.setDrawColor(229, 231, 235);
      pdf.line(marginX, y, pageWidth - marginX, y);
      y += gapBottom;
    };

    if (activeLogo) {
      try {
        pdf.addImage(activeLogo, "PNG", marginX, y - 1, 14, 14);
      } catch {
        // Ignore logo rendering errors.
      }
    }

    addText("Comprobante electrónico", marginX + 18, 7, { bold: true });
    y += 4;
    addText(businessName, marginX + 18, 11, { bold: true });
    y += 4;
    addText(subtitle, marginX + 18, 6.5);
    y += 3;
    addText(`RUC ${ruc}`, marginX + 18, 6.5);

    y += 5;
    pdf.setFontSize(6.5);
    pdf.text("Boleta SUNAT", marginX, y);
    pdf.text(ticket.seriesNumber, pageWidth - marginX, y, { align: "right" });
    y += 4.5;
    pdf.text(printableDate, pageWidth - marginX, y, { align: "right" });

    addLine(2, 5);

    const infoRows = [
      ["Fecha", printableDate],
      ["Emisor", ticket.issuerName],
      ["RUC", ticket.issuerRuc],
      ["Cliente", ticket.customerName],
      [
        "Documento",
        hasCustomerDoc
          ? `${ticket.customerDocumentType} ${ticket.customerDocument}`
          : "Sin documento",
      ],
    ] as const;

    infoRows.forEach(([label, value]) => {
      pdf.setFontSize(6.5);
      pdf.setTextColor(107, 114, 128);
      pdf.text(normalizePdfText(label), marginX, y);
      pdf.setTextColor(17, 24, 39);
      const wrapped = pdf.splitTextToSize(normalizePdfText(String(value)), contentWidth / 2);
      pdf.text(wrapped, pageWidth - marginX, y, {
        align: "right",
        maxWidth: contentWidth / 2,
      });
      y += Math.max(4.5, wrapped.length * 3.5) + 1.5;
    });

    addLine(2, 5);

    pdf.setTextColor(17, 24, 39);
    ticket.items.forEach((item) => {
      const description = normalizePdfText(item.description);
      const descriptionLines = pdf.splitTextToSize(description, contentWidth - 34);
      const itemHeight = Math.max(18, descriptionLines.length * 3.5 + 9);
      pdf.roundedRect(marginX, y - 0.4, contentWidth, itemHeight, 2, 2, "S");
      pdf.setFontSize(6.1);
      pdf.setFont("helvetica", "bold");
      pdf.text(descriptionLines, marginX + 3, y + 4);
      pdf.setFontSize(7);
      pdf.text(
        normalizePdfText(`S/ ${formatMoney(item.total)}`),
        pageWidth - marginX - 3,
        y + 4,
        { align: "right" },
      );
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(5.8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(
        normalizePdfText(
          `Cant. ${item.quantity} · Unit. S/ ${formatMoney(item.unitPrice)}`,
        ),
        marginX + 3,
        y + itemHeight - 3,
      );
      pdf.setTextColor(17, 24, 39);
      y += itemHeight + 2;
    });

    if (ticket.items.length === 0) {
      pdf.setFontSize(6.5);
      pdf.setTextColor(107, 114, 128);
      pdf.text("Aún no hay líneas para mostrar.", marginX, y);
      y += 6;
    }

    addLine(2, 5);

    pdf.setFontSize(6.5);
    pdf.setTextColor(107, 114, 128);
    pdf.text("Subtotal", marginX, y);
    pdf.text(`S/ ${formatMoney(ticket.subtotal)}`, pageWidth - marginX, y, {
      align: "right",
    });
    y += 4.5;
    pdf.text("Descuento", marginX, y);
    pdf.text(`S/ ${formatMoney(ticket.discount)}`, pageWidth - marginX, y, {
      align: "right",
    });
    y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(8);
    pdf.text("Total", marginX, y);
    pdf.text(`S/ ${formatMoney(ticket.total)}`, pageWidth - marginX, y, {
      align: "right",
    });

    pdf.save(`${clientFirstName || "cliente"}-comprobante.pdf`);
  }

  const hasCustomerDoc =
    ticket.customerDocument !== "Sin documento" &&
    ticket.customerDocument !== "—";
  const activeLogo = logo;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.10),_transparent_28%),linear-gradient(180deg,_#fafafa_0%,_#ffffff_55%,_#f4f4f5_100%)] text-zinc-950 transition-colors dark:bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.12),_transparent_25%),linear-gradient(180deg,_#09090b_0%,_#111113_100%)] dark:text-zinc-50 print:bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 md:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
        <div className="flex items-center justify-between gap-4 print:hidden">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-600 dark:text-fuchsia-400">
              EzComprobante
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Sube tu XML, personaliza e imprime.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setTheme((current) => (current === "dark" ? "light" : "dark"))
            }
            aria-label={
              theme === "dark" ? "Cambiar a modo día" : "Cambiar a modo oscuro"
            }
            className="gap-2"
          >
            {theme === "dark" ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  fill="currentColor"
                  d="M12 4.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 12 4.75ZM6.47 6.47a.75.75 0 0 1 1.06 0l.36.36a.75.75 0 1 1-1.06 1.06l-.36-.36a.75.75 0 0 1 0-1.06Zm11.7 0a.75.75 0 0 1 0 1.06l-.36.36a.75.75 0 1 1-1.06-1.06l.36-.36a.75.75 0 0 1 1.06 0ZM4.75 12a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 4.75 12Zm12.75-.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5ZM12 18.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm-5.17-1.22a.75.75 0 0 1 1.06 0l.36.36a.75.75 0 0 1-1.06 1.06l-.36-.36a.75.75 0 0 1 0-1.06Zm9.12 0a.75.75 0 0 1 1.06 1.06l-.36.36a.75.75 0 1 1-1.06-1.06l.36-.36ZM12 7.25a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5Z"
                />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  fill="currentColor"
                  d="M12.06 4.5a.75.75 0 0 1 .66.98 6.5 6.5 0 0 0 8.3 8.3.75.75 0 0 1 .98.66 8.5 8.5 0 1 1-9.94-9.94Z"
                />
              </svg>
            )}
            {theme === "dark" ? "Modo día" : "Modo oscuro"}
          </Button>
        </div>
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start print:block">
          <Card className="overflow-hidden border-zinc-200/80 bg-white/90 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 print:hidden">
            <CardHeader className="gap-5 border-b border-zinc-200/70 dark:border-zinc-800">
              <CardTitle className="text-4xl leading-tight md:text-6xl">
                <span className="bg-gradient-to-r from-fuchsia-600 via-rose-500 to-orange-400 bg-clip-text text-transparent dark:from-fuchsia-400 dark:via-rose-300 dark:to-amber-200">
                  EzComprobante
                </span>{" "}
                <p className="text-2xl">
                  Convierte tu XML SUNAT en un ticket limpio y profesional
                </p>
              </CardTitle>
              <CardDescription className="max-w-2xl text-base md:text-lg">
                Sube tu boleta XML y genera un ticket listo para imprimir sin
                guardar datos en servidor.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="businessName">
                  Nombre de tu emprendimiento
                </Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="NutriMax Perú"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  La jerarquía visual prioriza tu marca: nombre primero, datos
                  después.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ruc">RUC de tu emprendimiento</Label>
                <Input
                  id="ruc"
                  value={ruc}
                  onChange={(e) => {
                    setRuc(e.target.value);
                    setRucSource("Manual");
                  }}
                  placeholder="2060..."
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Auto-detectado desde el XML o el nombre del archivo; puedes
                  corregirlo aquí. Fuente: {rucSource}.
                </p>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="subtitle">Descripción breve</Label>
                <Textarea
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Suplementos, creatina, proteína, asesoría nutricional"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Usa este espacio como subtítulo de marca, no como un bloque de
                  texto largo.
                </p>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="xml">Sube tu XML de SUNAT</Label>
                <Input
                  id="xml"
                  ref={fileInputRef}
                  type="file"
                  accept=".xml,application/xml,text/xml"
                  className="cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/80"
                  onChange={(e) =>
                    void handleXmlUpload(e.target.files?.[0] ?? null).catch(
                      (err: unknown) =>
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Error leyendo XML",
                        ),
                    )
                  }
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Se procesa en tu navegador. El archivo se limpia de memoria al
                  terminar.
                </p>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="logo">Sube tu logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/80"
                  onChange={(e) =>
                    handleLogoUpload(e.target.files?.[0] ?? null)
                  }
                />
              </div>
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button
                  onClick={() => void handleGeneratePdf()}
                  disabled={!isReady}
                >
                  Generar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTicket(fallbackTicket)}
                >
                  Limpiar vista
                </Button>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 md:col-span-2">
                {status}
              </p>
              {error ? (
                <p className="text-sm font-medium text-red-600 md:col-span-2">
                  {error}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="sticky top-6 flex flex-col justify-between self-start border-zinc-200/80 bg-white/90 text-zinc-950 shadow-lg dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-50 lg:max-h-[calc(100vh-3rem)] print:static print:max-h-none print:border-0 print:bg-white print:shadow-none print:text-zinc-950">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">
                    Vista previa del ticket
                  </CardTitle>
                  <CardDescription className="text-zinc-600 dark:text-zinc-300">
                    Se genera solo en memoria. Al cerrar o recargar, desaparece.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-[28px] bg-white p-5 text-zinc-950 shadow-2xl dark:bg-zinc-50">
                <div className="flex items-start gap-4">
                  <div className="h-18 w-18 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-200">
                    {activeLogo ? (
                      <img
                        src={activeLogo}
                        alt="Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                        Logo
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-zinc-400">
                      EzComprobante
                    </p>
                    <p className="mt-1 text-3xl font-bold leading-tight text-zinc-900 md:text-4xl">
                      {businessName}
                    </p>
                    <p className="mt-1 text-xs font-medium text-zinc-500 md:text-sm">
                      {subtitle}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">RUC {ruc}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="text-xs text-zinc-500">
                    <p>Boleta SUNAT</p>
                    <p>{ticket.seriesNumber}</p>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <p>{printableDate}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Fecha</span>
                    <span className="font-medium">{printableDate}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Emisor</span>
                    <span className="font-medium text-right">
                      {ticket.issuerName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">RUC</span>
                    <span className="font-medium">{ticket.issuerRuc}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Cliente</span>
                    <span className="font-medium text-right">
                      {ticket.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Documento</span>
                    <span className="font-medium">
                      {hasCustomerDoc
                        ? `${ticket.customerDocumentType} ${ticket.customerDocument}`
                        : "Sin documento"}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  {ticket.items.length > 0 ? (
                    ticket.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-zinc-50 p-3 text-sm dark:bg-zinc-100"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium">{item.description}</p>
                          <p className="shrink-0 font-semibold">
                            S/ {formatMoney(item.total)}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          Cant. {item.quantity} · Unit. S/{" "}
                          {formatMoney(item.unitPrice)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-500 dark:bg-zinc-100">
                      Aún no hay líneas para mostrar.
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Subtotal</span>
                    <span>S/ {formatMoney(ticket.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Descuento</span>
                    <span>S/ {formatMoney(ticket.discount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>S/ {formatMoney(ticket.total)}</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                Privacidad: el XML se procesa localmente y no se envía a
                servidor.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
