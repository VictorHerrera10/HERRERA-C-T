import { getSiteContent } from "@/modules/website/lib/content";
import { Navbar } from "@/modules/website/components/Navbar";
import { Hero } from "@/modules/website/components/Hero";
import { Marquee } from "@/modules/website/components/Marquee";
import { Services } from "@/modules/website/components/Services";
import { About } from "@/modules/website/components/About";
import { Process } from "@/modules/website/components/Process";
import { Projects } from "@/modules/website/components/Projects";
import { Testimonials } from "@/modules/website/components/Testimonials";
import { Contact } from "@/modules/website/components/Contact";
import { Footer } from "@/modules/website/components/Footer";
import { CodexWidget } from "@/modules/website/components/Codex/CodexWidget";

// El contenido se edita desde /admin: renderizar siempre fresco.
export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getSiteContent();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero content={content.hero} />
        <Marquee content={content.marquee} />
        <Services services={content.services} />
        <About content={content.about} />
        <Process content={content.process} />
        <Projects projects={content.projects} />
        <Testimonials testimonials={content.testimonials} />
        <Contact content={content.contact} />
      </main>
      <Footer content={content.footer} />
      <CodexWidget />
    </>
  );
}
