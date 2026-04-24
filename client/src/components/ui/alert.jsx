import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

export function Alert({ className, intent = "default", title, children }) {
  const styles = {
    default: "border-border bg-white/80 text-foreground",
    error: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };

  const Icon = intent === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div className={cn("flex gap-3 rounded-[24px] border p-4 text-sm", styles[intent], className)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        {title ? <p className="font-medium">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
