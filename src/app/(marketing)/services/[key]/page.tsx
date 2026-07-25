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
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">{svc.title}</span>
          <h1>{svc.title}</h1>
          <p className="sub">{svc.sub}</p>
        </div>
      </section>
      <section className="ivory sec">
        <div className="mk-container split" style={{ alignItems: "flex-start" }}>
          <div className="reveal">
            <span className="kicker">What&apos;s included</span>
            <div className="sd-list">
              {svc.included.map((item, i) => (
                <div className="sd-item" key={i}>{CheckIc}{item}</div>
              ))}
            </div>
          </div>
          <div className="reveal">
            <span className="kicker">How it works</span>
            <div className="steps">
              {svc.steps.map((st, i) => (
                <div className="step" key={i}>
                  <h3>{st.t}</h3>
                  <p>{st.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <CtaBand heading={`Discuss *${svc.band}* with us`} />
    </main>
  );
}
