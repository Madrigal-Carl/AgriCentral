import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  ArrowRight,
  AlertTriangle,
  Tractor,
  MapPinned,
  FileWarning,
  Users,
  Beef,
  ClipboardList,
  ShieldCheck,
  AlertCircle,
  FileText,
  BarChart3,
  Package,
  CheckCircle,
  Sprout,
  ClipboardCheck,
  Building2,
  LayoutDashboard,
  Clock3,
  Circle,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaGithub,
} from "react-icons/fa6";

import logoAsset from "@/assets/logo.png";
import barnAsset from "@/assets/images/barn.jpg";
import farmAerialAsset from "@/assets/images/farm-aerial.jpg";
import farmerFieldAsset from "@/assets/images/farmer-field.jpg";
import livestockAsset from "@/assets/images/livestock.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const links = [
  { label: "Challenges", to: "#challenges" },
  { label: "Solutions", to: "#solutions" },
  { label: "Features", to: "#features" },
  { label: "Resource Tracking", to: "#resource-tracking" },
  { label: "Reporting", to: "#reporting" },
];

function SectionLabel({ children }) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-ink-muted uppercase">
      <span className="text-ink">[</span>
      {children}
      <span className="text-ink">]</span>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logoAsset}
        alt="AgriCentral"
        className="h-8 w-8 object-contain"
      />
      <span className="text-[17px] font-semibold tracking-tight text-ink">
        AgriCentral
      </span>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/85 border-b border-zinc-200 transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Brand />
          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.to}
                className="text-[13.5px] text-[#4c4e50] hover:text-ink transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/auth"
              className="px-3 py-2 text-[13.5px] text-[#3F4448] hover:text-ink transition-colors"
            >
              Login
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-[5px] bg-ink px-3.5 py-2 text-[13.5px] font-medium text-white hover:bg-black transition-colors"
            >
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="lg:hidden grid h-9 w-9 place-items-center rounded-[5px] border border-zinc-200"
          >
            <Menu className="h-4.5 w-4.5 text-ink" />
          </button>
        </div>
      </header>

      <motion.div
        initial={false}
        animate={{ x: open ? 0 : "100%" }}
        transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.32 }}
        className="fixed inset-y-0 right-0 z-[60] w-[82%] max-w-sm bg-white border-l border-zinc-200 lg:hidden"
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-200">
          <Brand />
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-[5px] border border-zinc-200"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <nav className="flex flex-col p-5 gap-1">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              onClick={() => setOpen(false)}
              className="px-3 py-3 text-[15px] text-ink rounded-[5px] hover:bg-zinc-50"
            >
              {l.label}
            </a>
          ))}
          <div className="h-px bg-zinc-200 my-3" />
          <Link
            to="/auth"
            className="px-3 py-3 text-[15px] text-ink rounded-[5px] hover:bg-zinc-50"
          >
            Login
          </Link>
          <Link
            to="/auth"
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-[5px] bg-ink px-3.5 py-3 text-[14px] font-medium text-white"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </motion.div>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[55] bg-black/30 lg:hidden"
        />
      )}
    </>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[100svh] flex items-center pt-10 pb-20 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${barnAsset})` }}
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-white/70 uppercase">
              <span className="text-white">[</span>AGRICULTURAL INTELLIGENCE
              PLATFORM<span className="text-white">]</span>
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mt-5 text-[2.25rem] leading-[1.08] tracking-[-0.02em] font-medium text-white sm:text-[2.75rem] lg:text-[3.5rem]"
          >
            Smarter Resource Allocation for Modern Agriculture
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-5 text-[0.95rem] sm:text-[1.02rem] leading-relaxed text-white/80 max-w-2xl mx-auto"
          >
            AgriCentral helps agricultural offices, cooperatives, and farmer
            associations monitor farms, livestock, equipment, reports, and
            disaster response operations from a single platform.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a
              href="#get-started"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-[5px] bg-white px-5 py-3 text-[14px] font-medium text-ink hover:bg-white/90 transition-colors"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#challenges"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-[5px] border border-white/30 bg-white/10 px-5 py-3 text-[14px] font-medium text-white hover:bg-white/20 transition-colors"
            >
              Explore Platform
            </a>
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10.5px] tracking-[0.14em] text-white/60 uppercase"
          >
            <span className="inline-flex items-center gap-1.5">
              <Circle className="h-2 w-2 fill-accent-agri text-accent-agri" />{" "}
              System Operational
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Section({ id, label, title, description, children, className = "" }) {
  return (
    <section
      id={id}
      className={`py-20 lg:py-32 border-t border-zinc-200 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-3xl"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>{label}</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-[1.65rem] sm:text-[2.15rem] lg:text-[2.5rem] leading-[1.12] tracking-[-0.02em] font-medium text-ink"
          >
            {title}
          </motion.h2>
          {description && (
            <motion.p
              variants={fadeUp}
              className="mt-4 text-[0.98rem] text-[#3F4448] leading-relaxed max-w-2xl"
            >
              {description}
            </motion.p>
          )}
        </motion.div>
        <div className="mt-10 lg:mt-16">{children}</div>
      </div>
    </section>
  );
}

function ProblemCard({ icon: Icon, n, title, desc }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group rounded-[5px] border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-[0_12px_30px_-20px_rgba(15,17,18,0.15)] transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-[5px] bg-canvas border border-zinc-200">
          <Icon className="h-4.5 w-4.5 text-ink" />
        </div>
        <span className="font-mono text-[10px] tracking-[0.14em] text-ink-muted">
          0{n}
        </span>
      </div>
      <h3 className="mt-5 text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#3F4448]">
        {desc}
      </p>
    </motion.div>
  );
}

function FeatureRow({ icon: Icon, title, desc, mono }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group p-6 border border-transparent hover:border-zinc-200 hover:bg-white rounded-[5px] transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[3px] bg-ink">
          <Icon className="h-4 w-4 text-accent-agri" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-[0.14em] text-ink-muted uppercase">
            {mono}
          </div>
          <h3 className="mt-1 text-[15px] font-semibold text-ink">{title}</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#3F4448]">
            {desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function WorkflowStep({ icon: Icon, n, title, desc, last }) {
  return (
    <motion.div variants={fadeUp} className="relative flex-1">
      <div className="flex items-center">
        <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white border border-zinc-300">
          <Icon className="h-4 w-4 text-ink" />
        </div>
        {!last && (
          <div className="hidden lg:block flex-1 h-px bg-zinc-200 relative">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: n * 0.08 }}
              style={{ transformOrigin: "left" }}
              className="absolute inset-0 bg-ink"
            />
          </div>
        )}
      </div>
      <div className="mt-3 pr-2 lg:pr-4">
        <div className="font-mono text-[10px] tracking-[0.14em] text-ink-muted">
          STEP 0{n}
        </div>
        <div className="mt-1 text-[13.5px] font-medium text-ink leading-snug">
          {title}
        </div>
        {desc && (
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
            {desc}
          </p>
        )}
      </div>
      {!last && (
        <div className="md:hidden absolute left-5 top-10 w-px h-6 bg-zinc-200" />
      )}
    </motion.div>
  );
}

function ModuleCard({ icon: Icon, title, desc }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="rounded-[5px] border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-[0_12px_30px_-20px_rgba(15,17,18,0.15)] transition-all"
    >
      <Icon className="h-4.5 w-4.5 text-ink" />
      <h3 className="mt-4 text-[14px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#3F4448]">
        {desc}
      </p>
    </motion.div>
  );
}

function BenefitCard({ icon: Icon, n, title, desc, img }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group rounded-[5px] border border-zinc-200 bg-white overflow-hidden hover:shadow-[0_18px_40px_-25px_rgba(15,17,18,0.2)] transition-shadow"
    >
      <div className="aspect-[16/10] overflow-hidden bg-zinc-100">
        <img
          src={img}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="grid h-9 w-9 place-items-center rounded-[3px] bg-ink">
            <Icon className="h-4 w-4 text-accent-agri" strokeWidth={2.25} />
          </div>
          <span className="font-mono text-[10px] tracking-[0.14em] text-ink-muted">
            0{n}
          </span>
        </div>
        <h3 className="mt-4 text-[16px] font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#3F4448]">
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

export function HomePage() {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Disaster Prioritization",
      desc: "Officials often struggle to determine which farmers should receive livestock, equipment, seeds, or financial assistance first.",
    },
    {
      icon: Tractor,
      title: "Equipment Visibility",
      desc: "There is no centralized way to identify where equipment is located or who currently uses it.",
    },
    {
      icon: MapPinned,
      title: "Farm Visibility",
      desc: "Finding farms that currently grow specific crops can be difficult and time-consuming.",
    },
    {
      icon: FileWarning,
      title: "Manual Reporting",
      desc: "Critical reports are often delayed, limiting timely decision-making.",
    },
  ];

  const features = [
    {
      icon: Users,
      title: "Farmer Registry",
      mono: "REGISTRY / 01",
      desc: "Maintain a centralized database of farmers, associations, and organizations.",
    },
    {
      icon: MapPinned,
      title: "Farm Mapping",
      mono: "MAPPING / 02",
      desc: "Visualize farms and monitor crop locations across municipalities.",
    },
    {
      icon: Tractor,
      title: "Equipment Tracking",
      mono: "TRACKING / 03",
      desc: "Track equipment ownership, usage, borrowing history, and maintenance.",
    },
    {
      icon: Beef,
      title: "Livestock Monitoring",
      mono: "LIVESTOCK / 04",
      desc: "Monitor livestock inventories, movement, and distribution records.",
    },
    {
      icon: ClipboardList,
      title: "Incident Reporting",
      mono: "INCIDENTS / 05",
      desc: "Submit and manage reports related to disasters, crop damage, livestock conditions, and equipment issues.",
    },
    {
      icon: ShieldCheck,
      title: "Audit Tracking",
      mono: "AUDIT / 06",
      desc: "Maintain complete accountability through detailed audit logs and activity records.",
    },
  ];

  const workflow = [
    {
      icon: AlertCircle,
      title: "Disaster Occurs",
      desc: "Natural or man-made events trigger the response protocol.",
    },
    {
      icon: FileText,
      title: "Farmers Submit Reports",
      desc: "Affected farmers log damage reports via the platform.",
    },
    {
      icon: MapPinned,
      title: "Affected Areas Verified",
      desc: "Officials confirm and geo-tag reported areas.",
    },
    {
      icon: BarChart3,
      title: "Impact Assessment Dashboard",
      desc: "Real-time analytics quantify total damage and needs.",
    },
    {
      icon: Package,
      title: "Resource Prioritization",
      desc: "Resources are ranked by urgency and impact severity.",
    },
    {
      icon: CheckCircle,
      title: "Aid Distribution",
      desc: "Assistance is tracked from allocation to delivery.",
    },
  ];

  const modules = [
    {
      icon: Users,
      title: "Farmer Management",
      desc: "Profiles, associations, and demographics in one registry.",
    },
    {
      icon: MapPinned,
      title: "Farm Management",
      desc: "Geo-tagged farm records with parcel-level detail.",
    },
    {
      icon: Sprout,
      title: "Crop Monitoring",
      desc: "Track crop types, and yield estimates.",
    },
    {
      icon: Beef,
      title: "Livestock Monitoring",
      desc: "Inventory, and distribution history.",
    },
    {
      icon: Tractor,
      title: "Equipment Tracking",
      desc: "Ownership, usage, and maintenance logs.",
    },
    {
      icon: Package,
      title: "Resource Requests",
      desc: "Manage crop, equipment, livestock requests.",
    },
    {
      icon: ClipboardList,
      title: "Incident Reporting",
      desc: "Centralized reporting for damages and incidents.",
    },
    {
      icon: ClipboardCheck,
      title: "Audit Logs",
      desc: "Immutable record of every action and decision.",
    },
    {
      icon: Building2,
      title: "Organization Management",
      desc: "Manage cooperatives, and roles.",
    },
    {
      icon: LayoutDashboard,
      title: "Dashboard Analytics",
      desc: "Real-time KPIs across regions and operations.",
    },
  ];

  const benefits = [
    {
      icon: Clock3,
      title: "Faster Disaster Response",
      desc: "Reduce delays in aid distribution and response planning.",
      img: farmerFieldAsset,
    },
    {
      icon: Package,
      title: "Better Resource Allocation",
      desc: "Identify where equipment, livestock, and assistance are most needed.",
      img: livestockAsset,
    },
    {
      icon: ShieldCheck,
      title: "Complete Accountability",
      desc: "Track all actions with comprehensive audit records.",
      img: farmAerialAsset,
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans antialiased selection:bg-ink selection:text-white">
      <Navbar />

      <main>
        <Hero />

        <Section
          id="challenges"
          label="CHALLENGES"
          title="Challenges Facing Agricultural Communities"
          description="Many agricultural offices still rely on fragmented records and manual processes, making disaster response and resource allocation difficult."
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {problems.map((p, i) => (
              <ProblemCard key={p.title} {...p} n={i + 1} />
            ))}
          </motion.div>
        </Section>

        <Section
          id="solutions"
          label="BENEFITS"
          title="Built for Faster Agricultural Operations"
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {benefits.map((b, i) => (
              <BenefitCard key={b.title} {...b} n={i + 1} />
            ))}
          </motion.div>
        </Section>

        <Section
          id="features"
          label="PLATFORM SOLUTION"
          title="One Platform. Complete Agricultural Visibility."
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 border border-zinc-200 rounded-[5px] bg-white divide-y md:divide-y-0 md:divide-x divide-zinc-200"
          >
            {features.map((f) => (
              <FeatureRow key={f.title} {...f} />
            ))}
          </motion.div>
        </Section>

        <Section
          id="resource-tracking"
          label="DISASTER RESPONSE"
          title="Prioritize Assistance with Data-Driven Decisions"
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="rounded-[5px] border border-zinc-200 bg-white p-6 lg:p-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row gap-6 md:gap-6 lg:gap-0">
              {workflow.map((s, i) => (
                <WorkflowStep
                  key={s.title}
                  icon={s.icon}
                  n={i + 1}
                  title={s.title}
                  desc={s.desc}
                  last={i === workflow.length - 1}
                />
              ))}
            </div>
          </motion.div>
        </Section>

        <Section
          id="reporting"
          label="PLATFORM MODULES"
          title="Everything Needed in One Platform"
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            {modules.map((m) => (
              <ModuleCard key={m.title} {...m} />
            ))}
          </motion.div>
        </Section>

        <section
          id="get-started"
          className="py-20 lg:py-32 border-t border-zinc-200"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-[8px] border border-zinc-200 bg-white p-8 sm:p-12 lg:p-16 text-center"
            >
              <SectionLabel>GET STARTED</SectionLabel>
              <h2 className="mt-5 text-[1.65rem] sm:text-[2.15rem] lg:text-[2.5rem] leading-[1.12] tracking-[-0.02em] font-medium text-ink max-w-2xl mx-auto">
                Transform Agricultural Resource Management
              </h2>
              <p className="mt-4 text-[0.98rem] leading-relaxed text-[#3F4448] max-w-xl mx-auto">
                Give agricultural offices complete visibility over farms,
                livestock, equipment, reports, and disaster response operations.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="#demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-[5px] bg-ink px-5 py-3 text-[14px] font-medium text-white hover:bg-black transition-colors"
                >
                  Request Demo <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/auth"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-[5px] border border-zinc-200 bg-white px-5 py-3 text-[14px] font-medium text-ink hover:border-zinc-300 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <Brand />
              <p className="mt-4 text-[13px] leading-relaxed text-[#3F4448] max-w-xs">
                Agricultural intelligence platform for resource management and
                disaster response.
              </p>
              <div className="mt-5 font-mono text-[10px] tracking-[0.14em] text-ink-muted uppercase">
                System Status · Operational
              </div>
            </div>
            <div className="md:justify-self-center text-ink-muted">
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase">
                Navigation
              </div>
              <nav className="flex flex-col p-5 gap-1">
                {links.map((l) => (
                  <a
                    href={l.to}
                    key={l.label}
                    className="hover:text-ink transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="md:justify-self-end text-ink-muted">
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase">
                Social
              </div>
              <nav className="flex gap-4 p-5">
                <a href="https://facebook.com" target="_blank" rel="noreferrer">
                  <FaFacebookF className="hover:text-ink transition-colors" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaInstagram className="hover:text-ink transition-colors" />
                </a>
                <a href="https://x.com" target="_blank" rel="noreferrer">
                  <FaXTwitter className="hover:text-ink transition-colors" />
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer">
                  <FaGithub className="hover:text-ink transition-colors" />
                </a>
              </nav>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="font-mono text-[10.5px] tracking-[0.12em] text-ink-muted uppercase">
              © 2026 AgriCentral. All rights reserved.
            </p>
            <p className="font-mono text-[10.5px] tracking-[0.12em] text-ink-muted uppercase">
              Build 2026.06 · Region 4B
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
