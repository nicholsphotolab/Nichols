import Nav from "@/components/layout/Nav";
import Link from "@/components/SmartLink";

// Rendered for any route that doesn't match a known page, and for a film
// stock / video category slug not present in the pricing data. Next's static
// export used to generate this automatically as 404.html; scripts/build.mjs
// writes this component's markup to out/404.html the same way.
export default function NotFoundPage() {
  return (
    <>
      <Nav solid />
      <main id="main" tabIndex={-1} style={{ padding: "160px var(--page-pad) 120px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Page not found</h1>
        <p style={{ marginBottom: "2rem" }}>
          The page you're looking for doesn't exist.
        </p>
        <Link href="/" className="reveal-on-hover">
          Back to home
        </Link>
      </main>
    </>
  );
}
