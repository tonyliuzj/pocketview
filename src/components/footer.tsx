import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          PocketView open source on{" "}
          <Link
            href="https://github.com/tonyliuzj/pocketview"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            GitHub
          </Link>
          {" "}by{" "}
          <Link
            href="https://tony-liu.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            tony-liu.com
          </Link>
        </p>
      </div>
    </footer>
  );
}
