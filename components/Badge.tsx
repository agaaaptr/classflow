const STYLES: Record<string, string> = {
  paid: "bg-success/15 text-success",
  approved: "bg-success/15 text-success",
  unpaid: "bg-cloud/70 text-muted",
  draft: "bg-cloud/70 text-muted",
  submitted: "bg-gold/25 text-navy",
  cancelled: "bg-danger/15 text-danger",
  active: "bg-success/15 text-success",
};

const LABELS: Record<string, string> = {
  paid: "Lunas",
  approved: "Disetujui",
  unpaid: "Belum bayar",
  draft: "Draft",
  submitted: "Menunggu",
  cancelled: "Dibatalkan",
  active: "Aktif",
};

export default function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STYLES[status] ?? "bg-cloud/70 text-muted"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
