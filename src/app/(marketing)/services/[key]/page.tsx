import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, SERVICES } from "@/components/marketing/ServiceIcons";
import { CtaBand } from "@/components/marketing/CtaBand";
import { CheckIc } from "@/components/marketing/mk";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ key: s.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }) {
  const svc = getService((await params).key);
  return { title: svc?.title ?? "Service" };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const svc = getService((await params).key);
  if (!svc) notFound();
  return (
    <main>
      <section className="phero">
        <div className="mk-container">
          <span className="kicker">Service</span>
          <h1>{svc.title}</h1>
          <p className="sub">{svc.sub}</p>
        </div>
      </section>
      <section className="ivory sec">
        <div className="mk-container" style={{ maxWidth: 820 }}>
          <h2>What is included</h2>
          <div className="sd-list" style={{ marginBottom: 34 }}>
            {svc.included.map((item, i) => (
              <div className="sd-item" key={i}>{CheckIc}{item}</div>
            ))}
          </div>
          <h2>How it works</h2>
          <div className="cards3" style={{ marginTop: 18 }}>
            {svc.steps.map((st, i) => (
              <div className="how-card" key={i}>
                <div className="n">0{i + 1}</div>
                <h3>{st.t}</h3>
                <p>{st.d}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 38 }}>
            <Link href="/contact" className="pill">Book Your Free 30-Minute Consultation</Link>
          </div>
        </div>
      </section>
      <CtaBand heading={`Discuss *${svc.band}* with us`} />
    </main>
  );
}
