import Nav from "@/components/layout/Nav";
import PageHero from "@/components/page/PageHero";
import page from "@/components/page/Page.module.css";
import PassportPackages from "./PassportPackages";

export default function PassportPage() {
  return (
    <>
      <Nav activeHref="/passport" />

      <main id="main" tabIndex={-1} className={page.page}>
        <PageHero
          label="Passport"
          title="Passport"
          titleBearing={0.078}
          image="/Passport-Hero.jpg"
          description={
            <>
              From US passports to Canada, Australia and beyond, we shoot and
              print to each country&rsquo;s exact specs, so your application
              clears the first time.
            </>
          }
          // Wider than the film hero's to fit the longer copy.
          descriptionSpan={8}
          meta={
            <>
              Ilford HP5
              <br />
              B&amp;W • 24exp
            </>
          }
        />

        <PassportPackages />
      </main>
    </>
  );
}
