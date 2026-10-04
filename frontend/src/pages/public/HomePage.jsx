import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  ArrowRight,
  AlertTriangle,
  Tractor,
  MapPinned,
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
  Wheat,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaGithub,
} from "react-icons/fa6";

import logoAsset from "@/assets/logo.png";
import farmAsset from "@/assets/images/farm.jpg";
import fieldAsset from "@/assets/images/field.jpg";
import farmerAsset from "@/assets/images/farmer.jpg";
import livestockAsset from "@/assets/images/livestock.jpg";
import farmAssetWebp from "@/assets/images/farm.webp";
import fieldAssetWebp from "@/assets/images/field.webp";
import farmerAssetWebp from "@/assets/images/farmer.webp";
import livestockAssetWebp from "@/assets/images/livestock.webp";

/* Palette: brand #00A36C · forest #0F3D2E · harvest gold #E0A526 · mint #F1F8F3 · wheat #FBF6E8 */

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

/* ---------- Decorative SVGs (aria-hidden, low opacity) ---------- */
function FieldLines({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 200"
      fill="none"
      className={className}
    >
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path
          key={i}
          d={`M-20 ${190 - i * 24} C 100 ${150 - i * 24}, 260 ${230 - i * 24}, 420 ${150 - i * 24}`}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

function WheatStalk({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
    >
      <path d="M30 158V30" />
      {[34, 52, 70, 88].map((y) => (
        <g key={y}>
          <path
            d={`M30 ${y} C 18 ${y - 4}, 12 ${y - 14}, 14 ${y - 22} C 24 ${y - 18}, 30 ${y - 10}, 30 ${y}`}
          />
          <path
            d={`M30 ${y} C 42 ${y - 4}, 48 ${y - 14}, 46 ${y - 22} C 36 ${y - 18}, 30 ${y - 10}, 30 ${y}`}
          />
        </g>
      ))}
      <path d="M30 30 C 24 22, 24 12, 30 4 C 36 12, 36 22, 30 30Z" />
    </svg>
  );
}

function SectionLabel({ children, light = false }) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.16em] uppercase ${light ? "text-white/75" : "text-[#4c5a54]"}`}
    >
      <span className="h-[3px] w-6 rounded-full bg-[#E0A526]" />
      {children}
    </div>
  );
}

function Brand({ light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logoAsset}
        alt="AgriCentral"
        className="h-8 w-8 object-contain"
      />
      <div className="leading-tight">
        <span
          className={`block text-[17px] font-semibold tracking-tight ${light ? "text-white" : "text-[#0F3D2E]"}`}
        >
          AgriCentral
        </span>
        <span
          className={`block text-[9.5px] tracking-[0.12em] uppercase ${light ? "text-white/60" : "text-[#00A36C]"}`}
        >
          PAgriO Platform
        </span>
      </div>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#d9e8de] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Brand />
          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.to}
                className="text-[13.5px] text-[#3b4a44] transition-colors hover:text-[#00A36C]"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/auth"
              className="px-3 py-2 text-[13.5px] text-[#3b4a44] transition-colors hover:text-[#00A36C]"
            >
              Login
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#00A36C] px-3.5 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-[#008a5b]"
            >
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="lg:hidden grid h-9 w-9 place-items-center rounded-[5px] border border-[#d9e8de]"
          >
            <Menu className="h-4.5 w-4.5 text-[#0F3D2E]" />
          </button>
        </div>
      </header>

      <motion.div
        initial={false}
        animate={{ x: open ? 0 : "100%" }}
        transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.32 }}
        className="fixed inset-y-0 right-0 z-[60] w-[82%] max-w-sm border-l border-[#d9e8de] bg-white lg:hidden"
      >
        <div className="flex h-16 items-center justify-between border-b border-[#d9e8de] px-5">
          <Brand />
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-[5px] border border-[#d9e8de]"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-5">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              onClick={() => setOpen(false)}
              className="rounded-[5px] px-3 py-3 text-[15px] text-[#0F3D2E] hover:bg-[#F1F8F3]"
            >
              {l.label}
            </a>
          ))}
          <div className="my-3 h-px bg-[#d9e8de]" />
          <Link
            to="/auth"
            className="rounded-[5px] px-3 py-3 text-[15px] text-[#0F3D2E] hover:bg-[#F1F8F3]"
          >
            Login
          </Link>
          <Link
            to="/auth"
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-[5px] bg-[#00A36C] px-3.5 py-3 text-[14px] font-medium text-white"
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

function Picture({ webp, jpg, alt = "", ...rest }) {
  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img src={jpg} alt={alt} {...rest} />
    </picture>
  );
}

function Hero() {
  const chips = [
    { icon: Wheat, label: "Farms" },
    { icon: Beef, label: "Livestock" },
    { icon: Tractor, label: "Equipment" },
    { icon: ShieldCheck, label: "Disaster Response" },
  ];
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pb-24 pt-10">
      <Picture
        webp={farmAssetWebp}
        jpg={farmAsset}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F3D2E]/80 via-[#0F3D2E]/60 to-[#0a2a20]/85" />
      <FieldLines className="pointer-events-none absolute inset-x-0 bottom-0 h-56 w-full text-white/10" />
      <WheatStalk className="pointer-events-none absolute -right-2 bottom-0 hidden h-72 text-[#E0A526]/25 lg:block" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E0A526]/40 bg-[#E0A526]/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#F3CC6B]">
              <Sprout className="h-3.5 w-3.5" /> Agricultural Intelligence
              Platform
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mt-5 text-[2.25rem] font-medium leading-[1.08] tracking-[-0.02em] text-white sm:text-[2.75rem] lg:text-[3.5rem]"
          >
            Smarter Resource Allocation for Modern Agriculture
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-2xl text-[0.95rem] leading-relaxed text-white/85 sm:text-[1.02rem]"
          >
            AgriCentral helps agricultural offices, cooperatives, and farmer
            associations monitor farms, livestock, equipment, reports, and
            disaster response operations from a single platform.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <a
              href="#get-started"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-[5px] bg-[#00A36C] px-5 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#00b87a] sm:w-auto"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#challenges"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-[5px] border border-white/30 bg-white/10 px-5 py-3 text-[14px] font-medium text-white transition-colors hover:bg-white/20 sm:w-auto"
            >
              Explore Platform
            </a>
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-2.5"
          >
            {chips.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[12.5px] text-white/90 backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 text-[#5be0ac]" /> {label}
              </span>
            ))}
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
      className={`relative overflow-hidden border-t border-[#d9e8de] py-20 lg:py-28 ${className}`}
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
            className="mt-4 text-[1.65rem] font-medium leading-[1.12] tracking-[-0.02em] text-[#0F3D2E] sm:text-[2.15rem] lg:text-[2.5rem]"
          >
            {title}
          </motion.h2>
          {description && (
            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-[#3F4B46]"
            >
              {description}
            </motion.p>
          )}
        </motion.div>
        <div className="mt-10 lg:mt-14">{children}</div>
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
      className="group rounded-lg border border-[#ecd9a8] border-t-[3px] border-t-[#E0A526] bg-white p-6 transition-shadow hover:shadow-[0_14px_32px_-20px_rgba(15,61,46,0.35)]"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#E0A526]/15">
          <Icon className="h-4.5 w-4.5 text-[#9a6b00]" />
        </div>
        <span className="font-mono text-[10px] tracking-[0.14em] text-[#9a6b00]">
          0{n}
        </span>
      </div>
      <h3 className="mt-5 text-[15px] font-semibold text-[#0F3D2E]">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#3F4B46]">
        {desc}
      </p>
    </motion.div>
  );
}

function FeatureRow({ icon: Icon, title, desc, mono }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group rounded-lg border border-transparent p-6 transition-colors hover:bg-[#F1F8F3]"
    >
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#00A36C]/10 transition-colors group-hover:bg-[#00A36C]">
          <Icon
            className="h-4.5 w-4.5 text-[#00A36C] transition-colors group-hover:text-white"
            strokeWidth={2.25}
          />
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#00A36C]">
            {mono}
          </div>
          <h3 className="mt-1 text-[15px] font-semibold text-[#0F3D2E]">
            {title}
          </h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#3F4B46]">
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
        <div className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#00A36C] shadow-[0_0_0_5px_rgba(0,163,108,0.14)]">
          <Icon className="h-4 w-4 text-white" />
        </div>
        {!last && (
          <div className="relative hidden h-px flex-1 bg-[#cfe3d6] lg:block">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: n * 0.08 }}
              style={{ transformOrigin: "left" }}
              className="absolute inset-0 bg-[#00A36C]"
            />
          </div>
        )}
      </div>
      <div className="mt-3 pr-2 lg:pr-4">
        <div className="font-mono text-[10px] tracking-[0.14em] text-[#9a6b00]">
          STEP 0{n}
        </div>
        <div className="mt-1 text-[13.5px] font-medium leading-snug text-[#0F3D2E]">
          {title}
        </div>
        {desc && (
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#5b6b64]">
            {desc}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function ModuleCard({ icon: Icon, title, desc }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group rounded-lg border border-[#d9e8de] border-b-[3px] border-b-transparent bg-white p-5 transition-all hover:border-b-[#00A36C] hover:shadow-[0_14px_32px_-20px_rgba(15,61,46,0.35)]"
    >
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#00A36C]/10">
        <Icon className="h-4.5 w-4.5 text-[#00A36C]" />
      </div>
      <h3 className="mt-4 text-[14px] font-semibold text-[#0F3D2E]">{title}</h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#3F4B46]">
        {desc}
      </p>
    </motion.div>
  );
}

function BenefitCard({ icon: Icon, n, title, desc, img, webp }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group overflow-hidden rounded-lg border border-[#d9e8de] bg-white transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(15,61,46,0.45)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F1F8F3]">
        <Picture
          webp={webp}
          jpg={img}
          alt={title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F3D2E]/55 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-4 rounded-full bg-[#E0A526] px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#3a2a00]">
          0{n}
        </span>
      </div>
      <div className="p-6">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#00A36C]/10">
          <Icon className="h-4 w-4 text-[#00A36C]" strokeWidth={2.25} />
        </div>
        <h3 className="mt-4 text-[16px] font-semibold text-[#0F3D2E]">
          {title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#3F4B46]">
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
      icon: ClipboardList,
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
      img: farmerAsset,
      webp: farmerAssetWebp,
    },
    {
      icon: Package,
      title: "Better Resource Allocation",
      desc: "Identify where equipment, livestock, and assistance are most needed.",
      img: livestockAsset,
      webp: livestockAssetWebp,
    },
    {
      icon: ShieldCheck,
      title: "Complete Accountability",
      desc: "Track all actions with comprehensive audit records.",
      img: fieldAsset,
      webp: fieldAssetWebp,
    },
  ];

  const grid = (cls, amount = 0.15) => ({
    variants: stagger,
    initial: "hidden",
    whileInView: "show",
    viewport: { once: true, amount },
    className: cls,
  });

  return (
    <div className="min-h-screen bg-white font-sans text-ink antialiased selection:bg-[#00A36C] selection:text-white">
      <Navbar />
      <main>
        <Hero />

        <Section
          id="challenges"
          label="Challenges"
          className="bg-[#FBF6E8]"
          title="Challenges Facing Agricultural Communities"
          description="Many agricultural offices still rely on fragmented records and manual processes, making disaster response and resource allocation difficult."
        >
          <motion.div
            {...grid("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4")}
          >
            {problems.map((p, i) => (
              <ProblemCard key={p.title} {...p} n={i + 1} />
            ))}
          </motion.div>
        </Section>

        <Section
          id="solutions"
          label="Benefits"
          className="bg-white"
          title="Built for Faster Agricultural Operations"
        >
          <motion.div {...grid("grid grid-cols-1 gap-5 md:grid-cols-3", 0.1)}>
            {benefits.map((b, i) => (
              <BenefitCard key={b.title} {...b} n={i + 1} />
            ))}
          </motion.div>
        </Section>

        <Section
          id="features"
          label="Platform Solution"
          className="bg-[#F1F8F3]"
          title="One Platform. Complete Agricultural Visibility."
        >
          <WheatStalk className="pointer-events-none absolute -right-4 top-10 hidden h-64 text-[#00A36C]/10 lg:block" />
          <motion.div
            {...grid(
              "grid grid-cols-1 gap-1 divide-y divide-[#d9e8de] rounded-lg border border-[#d9e8de] bg-white md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-3",
            )}
          >
            {features.map((f) => (
              <FeatureRow key={f.title} {...f} />
            ))}
          </motion.div>
        </Section>

        <Section
          id="resource-tracking"
          label="Disaster Response"
          className="bg-white"
          title="Prioritize Assistance with Data-Driven Decisions"
        >
          <motion.div
            {...grid(
              "rounded-lg border border-[#d9e8de] bg-gradient-to-br from-white to-[#F1F8F3] p-6 lg:p-10",
            )}
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:flex lg:flex-row lg:gap-0">
              {workflow.map((s, i) => (
                <WorkflowStep
                  key={s.title}
                  {...s}
                  n={i + 1}
                  last={i === workflow.length - 1}
                />
              ))}
            </div>
          </motion.div>
        </Section>

        <Section
          id="reporting"
          label="Platform Modules"
          className="bg-[#F1F8F3]"
          title="Everything Needed in One Platform"
        >
          <motion.div
            {...grid(
              "grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5",
              0.1,
            )}
          >
            {modules.map((m) => (
              <ModuleCard key={m.title} {...m} />
            ))}
          </motion.div>
        </Section>

        <section
          id="get-started"
          className="border-t border-[#d9e8de] bg-white py-20 lg:py-28"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0F3D2E] via-[#12503b] to-[#00805a] p-8 text-center sm:p-12 lg:p-16"
            >
              <FieldLines className="pointer-events-none absolute inset-x-0 bottom-0 h-48 w-full text-white/10" />
              <WheatStalk className="pointer-events-none absolute -left-2 bottom-0 hidden h-56 text-[#E0A526]/25 md:block" />
              <WheatStalk className="pointer-events-none absolute -right-2 bottom-0 hidden h-56 text-[#E0A526]/25 md:block" />
              <div className="relative">
                <SectionLabel light>Get Started</SectionLabel>
                <h2 className="mx-auto mt-5 max-w-2xl text-[1.65rem] font-medium leading-[1.12] tracking-[-0.02em] text-white sm:text-[2.15rem] lg:text-[2.5rem]">
                  Transform Agricultural Resource Management
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[0.98rem] leading-relaxed text-white/80">
                  Give agricultural offices complete visibility over farms,
                  livestock, equipment, reports, and disaster response
                  operations.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href="#demo"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-[5px] bg-[#E0A526] px-5 py-3 text-[14px] font-semibold text-[#3a2a00] transition-colors hover:bg-[#f0b83a] sm:w-auto"
                  >
                    Request Demo <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link
                    to="/auth"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-[5px] border border-white/30 bg-white/10 px-5 py-3 text-[14px] font-medium text-white transition-colors hover:bg-white/20 sm:w-auto"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0F3D2E] text-white/70">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <Brand light />
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/65">
                Agricultural intelligence platform for resource management and
                disaster response.
              </p>
            </div>
            <div className="md:justify-self-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#F3CC6B]">
                Navigation
              </div>
              <nav className="flex flex-col gap-1 p-5">
                {links.map((l) => (
                  <a
                    href={l.to}
                    key={l.label}
                    className="transition-colors hover:text-[#5be0ac]"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="md:justify-self-end">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#F3CC6B]">
                Social
              </div>
              <nav className="flex gap-4 p-5">
                {[
                  ["https://facebook.com", FaFacebookF, "Facebook"],
                  ["https://instagram.com", FaInstagram, "Instagram"],
                  ["https://x.com", FaXTwitter, "X"],
                  ["https://github.com", FaGithub, "GitHub"],
                ].map(([href, Icon, name]) => (
                  <a
                    key={name}
                    href={href}
                    aria-label={name}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon className="transition-colors hover:text-[#5be0ac]" />
                  </a>
                ))}
              </nav>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/15 pt-6 sm:flex-row sm:items-center">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-white/50">
              © 2026 AgriCentral. All rights reserved.
            </p>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-white/50">
              Build 2026.06 · Region 4B
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
