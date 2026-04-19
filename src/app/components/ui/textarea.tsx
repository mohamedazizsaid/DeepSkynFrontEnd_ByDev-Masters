import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-lg border bg-input-background/90 px-3 py-2 text-base shadow-[0_6px_14px_rgba(15,23,42,0.06)] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:shadow-[0_0_0_6px_rgba(14,165,233,0.12)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
