import { SITE } from "@/lib/site";

export function PromoFooter() {
  return (
    <footer className="border-t px-4 py-4 text-sm text-muted-foreground sm:px-5">
      <p className="max-w-3xl">
        Educational paper trading only. Not an offer, not advice, not a live
        hedge fund. Prices come from Yahoo Finance (delayed). Fills are paper.
        Do not trade this.
      </p>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Built to show the book in public.</span>
        <a
          href={SITE.xUrl}
          className="font-medium text-foreground underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Follow {SITE.xHandle} on X
        </a>
        <span aria-hidden="true">·</span>
        <a
          href={SITE.qinvestingUrl}
          className="font-medium text-foreground underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {SITE.qinvestingLabel}
        </a>
        <span aria-hidden="true">·</span>
        <a
          href={SITE.githubRepoUrl}
          className="font-medium text-foreground underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </p>
    </footer>
  );
}
