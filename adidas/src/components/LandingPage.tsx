import React, { useState } from "react";
import { UserRole, PortalType } from "../types";
import { AdidasThreeBars, AdidasTrefoil } from "./Common/AdidasBrandLogos";
import sambaImg from "../assets/images/adidas_samba_classic_1786858543624.jpg";
import gazelleImg from "../assets/images/adidas_gazelle_white_1786858564199.jpg";
import campusImg from "../assets/images/adidas_campus_black_1786858584028.jpg";
import ultraboostImg from "../assets/images/adidas_ultraboost_shoe_1786276134888.jpg";
import {
  TrendingUp,
  BarChart3,
  Users,
  FileText,
  Truck,
  PackageCheck,
  CreditCard,
  Layers,
  ArrowUpRight,
  ChevronDown,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Mail,
  FileCode,
  Check,
  Star,
  ChevronRight,
  BookOpen,
  Download,
  Building2,
  Leaf,
  Award,
  ExternalLink,
  Shield,
  FileCheck,
  CheckCircle
} from "lucide-react";

interface LandingPageProps {
  onLogin: (username: string, password: string, role: UserRole) => Promise<boolean>;
  loading: boolean;
  error?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, loading, error }) => {
  const [step, setStep] = useState<"home" | "portal" | "roles" | "login">("home");
  const [selectedPortal, setSelectedPortal] = useState<PortalType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [solutionsDropdown, setSolutionsDropdown] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | undefined>(error);

  const roleCredentials = [
    { role: "planner", username: "planner_alex", password: "password123", name: "Supply Chain Planner", desc: "Demand forecast, safety stock alerts, automated PR generation." },
    { role: "sourcing", username: "sourcing_maria", password: "password123", name: "Sourcing Specialist", desc: "PR queue, vendor form, RFQ bidding, quotation scoring & PO conversion." },
    { role: "manager", username: "manager_david", password: "password123", name: "Procurement Manager", desc: "PO multi-tier approvals, threshold checks, executive dashboards." },
    { role: "warehouse", username: "warehouse_kevin", password: "password123", name: "Warehouse Clerk", desc: "Shipment tracking, Goods Receipt (GR) posting, discrepancy logging." },
    { role: "accountant", username: "accountant_sarah", password: "password123", name: "AP Accountant", desc: "Automated 3-Way matching, invoice verification & payment batching." },
    { role: "admin", username: "admin_robert", password: "password123", name: "System Administrator", desc: "User management, role permissions matrix, immutable audit logs." },
    { role: "vendor", username: "vendor_prime", password: "password123", name: "Vendor / Supplier Partner", desc: "RFQ bid submission, PO confirmation, dispatch tracking & e-invoicing." },
  ];

  const scrollToSection = (sectionId: string) => {
    if (step !== "home") {
      setStep("home");
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleSelectPortal = (portal: PortalType) => {
    setSelectedPortal(portal);
    setStep("roles");
  };

  const handleSelectRole = (roleItem: typeof roleCredentials[0]) => {
    setSelectedRole(roleItem.role as UserRole);
    setUsername(roleItem.username);
    setPassword(roleItem.password);
    setLoginError(undefined);
    setStep("login");
  };

  const handleQuickAutoFill = (roleItem: typeof roleCredentials[0]) => {
    setSelectedRole(roleItem.role as UserRole);
    setUsername(roleItem.username);
    setPassword(roleItem.password);
    setLoginError(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setLoginError(undefined);
    const ok = await onLogin(username, password, selectedRole);
    if (!ok) {
      setLoginError("Login failed. Please verify account credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfb] text-black font-sans selection:bg-[#c6f135] selection:text-black">
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-18 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              setStep("home");
              setSelectedPortal(null);
              setSelectedRole(null);
            }}
          >
            <div className="text-black group-hover:scale-105 transition-transform">
              <AdidasThreeBars className="w-9 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight font-sans leading-none uppercase">
                ADIDAS
              </span>
              <span className="font-bold text-[10px] tracking-wider text-gray-500 font-mono uppercase">
                PROCUREMENT OS
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-gray-700">
            {/* SOLUTIONS with Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setSolutionsDropdown(true)}
              onMouseLeave={() => setSolutionsDropdown(false)}
            >
              <button
                onClick={() => {
                  scrollToSection("solutions");
                }}
                className="hover:text-black transition flex items-center space-x-1 cursor-pointer py-2"
              >
                <span>SOLUTIONS</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${solutionsDropdown ? "rotate-180 text-black" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {solutionsDropdown && (
                <div className="absolute top-full left-0 w-84 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 grid grid-cols-1 gap-1 z-50 animate-fadeIn">
                  <div className="text-[10px] font-mono font-black text-[#88b500] px-3 py-1 uppercase tracking-wider">
                    /// CORE ERP SOLUTIONS
                  </div>
                  {[
                    { title: "Demand Planning & MRP", desc: "Automated forecast & safety stock replenishment", sec: "features", icon: BarChart3 },
                    { title: "Sourcing & RFQ Bidding", desc: "Multi-supplier bidding & scoring matrix", sec: "solutions", icon: Users },
                    { title: "Purchase Order Workbench", desc: "Automated tax, compliance & multi-tier approval", sec: "solutions", icon: FileText },
                    { title: "Inbound Logistics & GRN", desc: "ASN tracking & Goods Receipt inspection", sec: "features", icon: PackageCheck },
                    { title: "3-Way Invoice Matching", desc: "PO × Delivery × Invoice automated reconciliation", sec: "solutions", icon: CheckCircle2 },
                    { title: "Spend & Supplier Analytics", desc: "OTIF performance & real-time KPI intelligence", sec: "suppliers", icon: TrendingUp },
                  ].map((sol, idx) => {
                    const SIcon = sol.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSolutionsDropdown(false);
                          scrollToSection(sol.sec);
                        }}
                        className="text-left p-2.5 hover:bg-gray-50 rounded-lg transition flex items-start space-x-3 group/item cursor-pointer"
                      >
                        <div className="p-1.5 bg-gray-100 rounded-md group-hover/item:bg-[#c6f135] transition text-black">
                          <SIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-black group-hover/item:text-[#7ba600] transition">
                            {sol.title}
                          </div>
                          <div className="text-[10px] text-gray-500 font-normal normal-case leading-tight">
                            {sol.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-black transition cursor-pointer"
            >
              FEATURES
            </button>
            <button
              onClick={() => scrollToSection("suppliers")}
              className="hover:text-black transition cursor-pointer"
            >
              SUPPLIERS
            </button>
            <button
              onClick={() => scrollToSection("resources")}
              className="hover:text-black transition cursor-pointer"
            >
              RESOURCES
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="hover:text-black transition cursor-pointer"
            >
              ABOUT
            </button>
          </nav>

          {/* Right Action Menu */}
          <div className="flex items-center space-x-5 text-xs font-bold font-mono">
            <div className="hidden sm:flex items-center space-x-1 text-gray-600 hover:text-black cursor-pointer">
              <Globe className="w-3.5 h-3.5" />
              <span>EN</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>

            {step !== "home" && (
              <button
                onClick={() => setStep("home")}
                className="text-gray-600 hover:text-black uppercase text-xs font-bold transition cursor-pointer"
              >
                MAIN PAGE
              </button>
            )}

            <button
              onClick={() => setStep("portal")}
              className="bg-black hover:bg-neutral-800 text-white font-bold px-4 py-2 text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer rounded-sm"
            >
              <span>LOGIN</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#c6f135]" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10 w-full">
        {step === "home" && (
          <div className="space-y-20 animate-fadeIn">
            {/* HERO SECTION */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Hero Text & CTAs */}
              <div className="md:col-span-6 space-y-6">
                <div className="flex items-center space-x-2 text-[#88b500] text-xs font-black uppercase tracking-widest font-mono">
                  <span className="text-[#a4d407] font-black">///</span>
                  <span>ONE PROCUREMENT ECOSYSTEM</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black uppercase tracking-tighter leading-[0.92] text-black">
                  PROCUREMENT
                  <br />
                  THAT MOVES
                  <br />
                  WITH CULTURE<span className="inline-block w-3.5 h-3.5 rounded-full bg-[#c6f135] ml-1.5 align-baseline"></span>
                </h1>

                <p className="text-gray-600 text-sm sm:text-base font-normal max-w-lg leading-relaxed">
                  From demand planning to supplier payment — one connected procurement ecosystem.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => setStep("portal")}
                    className="bg-[#c6f135] hover:bg-[#b5e028] text-black font-black text-xs uppercase tracking-wider px-6 py-3.5 flex items-center space-x-2 transition-all shadow-sm rounded-sm cursor-pointer font-mono"
                  >
                    <span>ENTER PROCUREMENT OS</span>
                    <ArrowUpRight className="w-4 h-4 text-black" />
                  </button>

                  <button
                    onClick={() => setStep("portal")}
                    className="bg-transparent hover:bg-gray-100 text-black font-bold text-xs uppercase tracking-wider px-5 py-3.5 flex items-center space-x-1.5 transition-all border border-gray-300 rounded-sm cursor-pointer font-mono"
                  >
                    <span>EXPLORE DEMO</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Right Column: Floating Sneaker Showcase (Samba, Gazelle, Campus) */}
              <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-4 lg:gap-5 items-stretch relative">
                {/* Samba OG Primary Card */}
                <div
                  onClick={() => setStep("portal")}
                  className="sm:col-span-7 bg-white border border-gray-100 p-5 sm:p-6 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] space-y-4 flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-black text-xl sm:text-2xl uppercase tracking-tight text-black leading-none">
                        SAMBA OG
                      </h2>
                      <span className="text-xs font-bold text-[#88b500] uppercase tracking-wider font-mono mt-1 block">
                        ORIGINALS
                      </span>
                    </div>
                    <div className="text-black">
                      <AdidasTrefoil className="w-8 h-8" />
                    </div>
                  </div>

                  {/* Shoe Image */}
                  <div className="h-44 sm:h-52 w-full flex items-center justify-center relative overflow-hidden my-2">
                    <img
                      src={sambaImg}
                      alt="Adidas Samba OG Classic"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 font-mono">
                    <span className="font-black text-2xl text-black">€120</span>
                    <span className="text-xs font-bold text-[#88b500] group-hover:text-black flex items-center space-x-1 uppercase transition">
                      <span>VIEW DETAILS</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Secondary Column: Gazelle & Campus 00s */}
                <div className="sm:col-span-5 flex flex-col justify-between gap-4">
                  {/* Gazelle */}
                  <div
                    onClick={() => setStep("portal")}
                    className="bg-white border border-gray-100 p-4 sm:p-4.5 rounded-[24px] shadow-[0_15px_40px_rgba(0,0,0,0.06)] space-y-2 group hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-base sm:text-lg uppercase tracking-tight text-black leading-none">
                          GAZELLE
                        </h3>
                        <span className="text-[10px] font-bold text-[#88b500] uppercase font-mono mt-0.5 block">
                          ORIGINALS
                        </span>
                      </div>
                    </div>
                    <div className="h-24 sm:h-28 w-full flex items-center justify-center my-1">
                      <img
                        src={gazelleImg}
                        alt="Gazelle Originals"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-1 font-mono">
                      <span className="font-black text-lg text-black">€110</span>
                      <span className="text-[11px] font-bold text-[#88b500] group-hover:text-black flex items-center space-x-0.5 uppercase transition">
                        <span>VIEW DETAILS</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Campus 00s */}
                  <div
                    onClick={() => setStep("portal")}
                    className="bg-white border border-gray-100 p-4 sm:p-4.5 rounded-[24px] shadow-[0_15px_40px_rgba(0,0,0,0.06)] space-y-2 group hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-base sm:text-lg uppercase tracking-tight text-black leading-none">
                          CAMPUS 00s
                        </h3>
                        <span className="text-[10px] font-bold text-[#88b500] uppercase font-mono mt-0.5 block">
                          ORIGINALS
                        </span>
                      </div>
                    </div>
                    <div className="h-24 sm:h-28 w-full flex items-center justify-center my-1">
                      <img
                        src={campusImg}
                        alt="Campus 00s"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-1 font-mono">
                      <span className="font-black text-lg text-black">€120</span>
                      <span className="text-[11px] font-bold text-[#88b500] group-hover:text-black flex items-center space-x-0.5 uppercase transition">
                        <span>VIEW DETAILS</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. SECTION: ONE FLOW. ZERO SILOS. (THE PROCUREMENT ECOSYSTEM) */}
            <section id="features" className="space-y-6 pt-10 border-t border-gray-200/80">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-4 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#88b500] tracking-widest font-mono">
                    THE PROCUREMENT ECOSYSTEM
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black leading-none">
                    ONE FLOW.
                    <br />
                    <span className="text-gray-400">ZERO SILOS.</span>
                  </h2>
                </div>

                {/* 6 Step Interactive Horizontal Pipeline */}
                <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { num: "01", title: "DEMAND PLANNING", sub: "Forecast Requirements", icon: BarChart3 },
                    { num: "02", title: "SOURCING & RFQ", sub: "Suppliers Quotations", icon: Users },
                    { num: "03", title: "PROCUREMENT & APPROVAL", sub: "Purchase Orders", icon: FileText },
                    { num: "04", title: "DELIVERY TRACKING", sub: "Shipment Tracking", icon: Truck },
                    { num: "05", title: "WAREHOUSE & QUALITY", sub: "Goods Receipt Quality Check", icon: PackageCheck },
                    { num: "06", title: "FINANCE & PAYMENT", sub: "Invoice Payment", icon: CreditCard },
                  ].map((stepItem) => {
                    const IconComp = stepItem.icon;
                    return (
                      <div
                        key={stepItem.num}
                        onClick={() => setStep("portal")}
                        className="bg-white border border-gray-200/80 p-3.5 rounded-xl hover:border-black transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md"
                      >
                        <div className="space-y-1">
                          <span className="text-[#88b500] font-mono font-black text-xs">
                            {stepItem.num}
                          </span>
                          <div className="font-black text-[11px] uppercase tracking-tight text-black leading-tight">
                            {stepItem.title}
                          </div>
                          <div className="text-[9px] text-gray-500 font-sans leading-tight">
                            {stepItem.sub}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-center text-gray-700 group-hover:text-black">
                          <IconComp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 4. SECTION: FROM FRAGMENTED TO CONNECTED (As-Is vs To-Be) */}
            <section className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black leading-tight">
                    FROM FRAGMENTED
                    <br />
                    <span className="text-[#8cb800]">TO CONNECTED.</span>
                  </h2>
                </div>
                <p className="text-xs text-gray-500 font-mono max-w-md">
                  Transforming isolated Excel silos and manual emails into an integrated real-time ERP data backbone.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* As-Is Card */}
                <div className="lg:col-span-5 bg-[#fafaf9] border border-gray-200 p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-xs font-black uppercase font-mono text-gray-500">AS-IS</span>
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded font-mono">FRAGMENTED</span>
                  </div>

                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="flex items-center space-x-2.5 bg-white p-2.5 border border-gray-200 rounded">
                      <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                      <span className="font-bold">Spreadsheets</span>
                    </div>
                    <div className="flex items-center space-x-2.5 bg-white p-2.5 border border-gray-200 rounded">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-bold">Emails</span>
                    </div>
                    <div className="flex items-center space-x-2.5 bg-white p-2.5 border border-gray-200 rounded">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-bold">Paper Documents</span>
                    </div>
                    <div className="flex items-center space-x-2.5 bg-white p-2.5 border border-gray-200 rounded">
                      <FileCode className="w-4 h-4 text-gray-500" />
                      <span className="font-bold">Standalone Systems</span>
                    </div>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className="lg:col-span-2 flex justify-center text-gray-400">
                  <div className="p-2 rounded-full bg-[#f4fce3] border border-[#c6f135] text-black">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </div>

                {/* To-Be Card */}
                <div className="lg:col-span-5 bg-white border-2 border-black p-5 rounded-xl space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-xs font-black uppercase font-mono text-[#7ca800]">TO-BE</span>
                    <span className="text-[10px] bg-[#c6f135] text-black font-black px-2 py-0.5 rounded font-mono">UNIFIED HUB</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 bg-[#fafaf9] border border-gray-200 rounded flex items-center space-x-2">
                      <BarChart3 className="w-3.5 h-3.5 text-black" />
                      <span className="font-bold">Planning</span>
                    </div>
                    <div className="p-2.5 bg-[#fafaf9] border border-gray-200 rounded flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-black" />
                      <span className="font-bold">Procurement</span>
                    </div>
                    <div className="p-2.5 bg-[#fafaf9] border border-gray-200 rounded flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-black" />
                      <span className="font-bold">Sourcing</span>
                    </div>
                    <div className="p-2.5 bg-[#fafaf9] border border-gray-200 rounded flex items-center space-x-2">
                      <CreditCard className="w-3.5 h-3.5 text-black" />
                      <span className="font-bold">Finance</span>
                    </div>
                    <div className="p-2.5 bg-[#fafaf9] border border-gray-200 rounded flex items-center space-x-2">
                      <PackageCheck className="w-3.5 h-3.5 text-black" />
                      <span className="font-bold">Warehouse</span>
                    </div>
                    <div className="p-2.5 bg-[#fafaf9] border border-gray-200 rounded flex items-center space-x-2">
                      <TrendingUp className="w-3.5 h-3.5 text-black" />
                      <span className="font-bold">Analytics</span>
                    </div>
                  </div>

                  <div className="pt-2 text-center border-t border-gray-100 flex items-center justify-center space-x-2">
                    <AdidasThreeBars className="w-5 h-4" />
                    <span className="font-black text-xs uppercase font-sans">ADIDAS PROCUREMENT OS</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. SECTION: REAL-TIME PROCUREMENT INTELLIGENCE (Analytics & Dashboard) */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black leading-tight">
                    REAL-TIME
                    <br />
                    PROCUREMENT <span className="text-[#8cb800]">INTELLIGENCE.</span>
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mt-1">
                    Make smarter decisions with live data and insights.
                  </p>
                </div>

                <button
                  onClick={() => setStep("portal")}
                  className="text-xs font-mono font-bold text-[#7ca800] hover:text-black flex items-center space-x-1 uppercase cursor-pointer"
                >
                  <span>VIEW DASHBOARD</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {/* 4 KPIs Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200/80 p-4 rounded-xl shadow-sm space-y-1">
                  <div className="text-[10px] font-bold text-gray-500 uppercase font-mono">TOTAL SPEND (THIS MONTH)</div>
                  <div className="text-2xl sm:text-3xl font-black text-black font-mono">€284.2K</div>
                  <div className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1 font-mono">
                    <span>↑ 18%</span>
                    <span className="text-gray-400 font-normal">vs last month</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200/80 p-4 rounded-xl shadow-sm space-y-1">
                  <div className="text-[10px] font-bold text-gray-500 uppercase font-mono">OTIF PERFORMANCE</div>
                  <div className="text-2xl sm:text-3xl font-black text-black font-mono">96.4%</div>
                  <div className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1 font-mono">
                    <span>↑ 6.2%</span>
                    <span className="text-gray-400 font-normal">vs last month</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200/80 p-4 rounded-xl shadow-sm space-y-1">
                  <div className="text-[10px] font-bold text-gray-500 uppercase font-mono">ACTIVE SUPPLIERS</div>
                  <div className="text-2xl sm:text-3xl font-black text-black font-mono">38</div>
                  <div className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1 font-mono">
                    <span>↑ 3</span>
                    <span className="text-gray-400 font-normal">vs last month</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200/80 p-4 rounded-xl shadow-sm space-y-1">
                  <div className="text-[10px] font-bold text-gray-500 uppercase font-mono">OPEN PURCHASE ORDERS</div>
                  <div className="text-2xl sm:text-3xl font-black text-black font-mono">24</div>
                  <div className="text-[11px] font-bold text-amber-600 flex items-center space-x-1 font-mono">
                    <span>4 overdue</span>
                  </div>
                </div>
              </div>

              {/* 3 Visual Cards: Spend Trend + Category Breakdown + Top Suppliers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Procurement Spend Line Chart */}
                <div className="bg-white border border-gray-200/80 p-5 rounded-xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-xs uppercase font-mono text-black">PROCUREMENT SPEND</h3>
                      <span className="text-[10px] text-gray-400 font-mono">(Last 6 Months)</span>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="h-44 w-full flex items-center justify-center">
                    <svg viewBox="0 0 280 140" className="w-full h-full text-black font-mono text-[9px]">
                      {/* Grid Lines */}
                      <line x1="30" y1="20" x2="270" y2="20" stroke="#f0f0ee" strokeWidth="1" />
                      <line x1="30" y1="55" x2="270" y2="55" stroke="#f0f0ee" strokeWidth="1" />
                      <line x1="30" y1="90" x2="270" y2="90" stroke="#f0f0ee" strokeWidth="1" />
                      <line x1="30" y1="120" x2="270" y2="120" stroke="#e0e0dc" strokeWidth="1" />

                      <text x="5" y="23" fill="#999">€300K</text>
                      <text x="5" y="58" fill="#999">€200K</text>
                      <text x="5" y="93" fill="#999">€100K</text>
                      <text x="15" y="123" fill="#999">€00</text>

                      {/* Line Polyline */}
                      <polyline
                        fill="none"
                        stroke="#a0d200"
                        strokeWidth="3"
                        points="45,110 85,90 125,75 165,75 205,50 245,40"
                      />

                      {/* Dots with Volt Lime */}
                      {[
                        { x: 45, y: 110, m: "Mar" },
                        { x: 85, y: 90, m: "Apr" },
                        { x: 125, y: 75, m: "May" },
                        { x: 165, y: 75, m: "Jun" },
                        { x: 205, y: 50, m: "Jul" },
                        { x: 245, y: 40, m: "Aug" },
                      ].map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#c6f135" stroke="#000000" strokeWidth="1.5" />
                          <text x={p.x - 8} y="135" fill="#666" fontSize="9">{p.m}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* 2. Spend by Category Donut Chart */}
                <div className="bg-white border border-gray-200/80 p-5 rounded-xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-xs uppercase font-mono text-black">SPEND BY CATEGORY</h3>
                      <span className="text-[10px] text-gray-400 font-mono">(This Month)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    {/* SVG Donut */}
                    <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {/* Circle background */}
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f0f0ee" strokeWidth="14" />
                        {/* Segment 1: Raw Materials 48% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#a0d200"
                          strokeWidth="14"
                          strokeDasharray="114 238"
                          strokeDashoffset="0"
                        />
                        {/* Segment 2: Packaging 22% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#000000"
                          strokeWidth="14"
                          strokeDasharray="52 238"
                          strokeDashoffset="-114"
                        />
                        {/* Segment 3: Accessories 18% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#666666"
                          strokeWidth="14"
                          strokeDasharray="42 238"
                          strokeDashoffset="-166"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-black text-xs font-mono">€284.2K</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">TOTAL</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-1.5 text-[11px] font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#a0d200]"></span>
                        <span className="text-gray-600">Raw Materials</span>
                        <span className="font-bold ml-auto">48%</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                        <span className="text-gray-600">Packaging</span>
                        <span className="font-bold ml-auto">22%</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                        <span className="text-gray-600">Accessories</span>
                        <span className="font-bold ml-auto">18%</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                        <span className="text-gray-600">Others</span>
                        <span className="font-bold ml-auto">12%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Top Suppliers List */}
                <div className="bg-white border border-gray-200/80 p-5 rounded-xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-xs uppercase font-mono text-black">TOP SUPPLIERS</h3>
                      <span className="text-[10px] text-gray-400 font-mono">(By Score)</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs font-mono pt-1">
                    {[
                      { rank: "01", name: "Adidas Supply Co.", score: 98.4, pct: 98 },
                      { rank: "02", name: "Global Sports Ltd.", score: 96.8, pct: 96 },
                      { rank: "03", name: "EuroSport Textile", score: 94.7, pct: 94 },
                      { rank: "04", name: "Prime Materials", score: 92.1, pct: 92 },
                      { rank: "05", name: "TechFabric Vietnam", score: 90.3, pct: 90 },
                    ].map((supp) => (
                      <div key={supp.rank} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-gray-500">{supp.rank} <span className="text-black font-semibold">{supp.name}</span></span>
                          <span className="font-black text-black">{supp.score}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#a0d200] rounded-full"
                            style={{ width: `${supp.pct}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 6. SECTION: SMART PROCUREMENT + SUPPLIER INTELLIGENCE */}
            <section id="suppliers" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left: Smart Procurement AI Trigger */}
              <div className="lg:col-span-5 bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-[#88b500] text-[10px] font-black uppercase font-mono tracking-wider">
                    <span>/// SMART PROCUREMENT</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black leading-tight">
                    THE SYSTEM SEES THE NEED BEFORE YOU DO.
                  </h3>
                </div>

                {/* Stock Alert Card */}
                <div className="bg-[#fcfcfb] border border-gray-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={sambaImg}
                      alt="Samba OG"
                      referrerPolicy="no-referrer"
                      className="w-16 h-12 object-contain"
                    />
                    <div>
                      <div className="font-black text-sm uppercase">SAMBA OG</div>
                      <div className="text-[10px] text-gray-500 font-mono">MAT-SAMBA-01 &bull; Rubber Outsole</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-2.5 border border-gray-200 rounded">
                    <div>
                      <span className="text-[9px] text-gray-400 block font-bold uppercase">Current Stock</span>
                      <span className="font-black text-black text-sm">180</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block font-bold uppercase">Safety Stock</span>
                      <span className="font-black text-black text-sm">200</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-amber-600 font-bold text-[10px] font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>BELOW SAFETY STOCK</span>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="bg-[#f4fce3] border border-[#c6f135] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase text-[#6f9600] font-mono block">AI RECOMMENDATION</span>
                    <span className="text-xs font-bold text-black">Recommended Qty</span>
                    <div className="font-black text-xl text-black font-mono">120 <span className="text-xs font-normal">pcs</span></div>
                  </div>
                  <button
                    onClick={() => setStep("portal")}
                    className="bg-[#c6f135] hover:bg-[#b8e526] text-black font-black text-xs uppercase px-4 py-2.5 rounded-sm font-mono flex items-center space-x-1 shadow-sm cursor-pointer"
                  >
                    <span>CREATE PR</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right: Supplier Intelligence Cards */}
              <div className="lg:col-span-7 bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#88b500] font-mono tracking-wider">
                      SUPPLIER INTELLIGENCE
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black leading-tight">
                      BETTER SUPPLIERS. BETTER DECISIONS.
                    </h3>
                  </div>

                  <button
                    onClick={() => setStep("portal")}
                    className="text-xs font-mono font-bold text-[#7ca800] hover:text-black flex items-center space-x-1 uppercase cursor-pointer"
                  >
                    <span>VIEW ALL SUPPLIERS</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 3 Supplier Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {[
                    { name: "ADIDAS SUPPLY CO.", score: "98.4", q: "98%", d: "97%", c: "94%" },
                    { name: "GLOBAL SPORTS LTD.", score: "96.8", q: "96%", d: "96%", c: "93%" },
                    { name: "EUROSPORT TEXTILE", score: "94.7", q: "94%", d: "95%", c: "91%" },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className="bg-[#fcfcfb] border border-gray-200 p-3.5 rounded-xl space-y-2 hover:border-black transition"
                    >
                      <div className="font-black text-xs uppercase tracking-tight text-black truncate">
                        {s.name}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xl text-black">{s.score}</span>
                        <div className="flex text-[#8cb800]">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200 space-y-1 text-[10px] font-mono">
                        <div className="flex justify-between text-gray-500">
                          <span>Quality</span>
                          <span className="font-bold text-black">{s.q}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Delivery</span>
                          <span className="font-bold text-black">{s.d}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Cost</span>
                          <span className="font-bold text-black">{s.c}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 7. SECTION: SOLUTIONS & END-TO-END PROCUREMENT PROCESS */}
            <section id="solutions" className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#88b500] font-mono tracking-wider block">
                    /// SOURCING TO PAY WORKFLOW
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black leading-tight mt-1">
                    END-TO-END
                    <br />
                    PROCUREMENT PROCESS.
                  </h2>
                  <p className="text-gray-500 text-xs font-mono mt-1">Full visibility & automated governance at every single milestone.</p>
                </div>

                <button
                  onClick={() => setStep("portal")}
                  className="text-xs font-mono font-bold text-[#7ca800] hover:text-black flex items-center space-x-1 uppercase cursor-pointer self-start sm:self-auto"
                >
                  <span>LAUNCH WORKFLOW</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {/* 5 Milestone Stepper */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                {[
                  { step: "01", name: "CREATE PR", desc: "Demand forecast & safety stock replenishment", icon: FileText, tag: "PLANNING" },
                  { step: "02", name: "CREATE PO", desc: "RFQ bidding matrix & quotation selection", icon: FileCode, tag: "SOURCING" },
                  { step: "03", name: "RECEIVE MATERIALS", desc: "Warehouse confirmation & QA inspection", icon: PackageCheck, tag: "LOGISTICS" },
                  { step: "04", name: "3-WAY MATCH", desc: "PO × Receipt × Invoice verified with tolerances", icon: CheckCircle2, tag: "ACCOUNTS PAYABLE" },
                  { step: "05", name: "PAY SUPPLIER", desc: "Automated payment release & settlement", icon: CreditCard, tag: "TREASURY" },
                ].map((item) => {
                  const IconC = item.icon;
                  return (
                    <div
                      key={item.step}
                      onClick={() => setStep("portal")}
                      className="bg-[#fafaf9] border border-gray-200 p-4 rounded-xl space-y-2 flex flex-col justify-between hover:border-black transition-all cursor-pointer group shadow-sm hover:shadow-md"
                    >
                      <div className="space-y-1.5">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-black group-hover:bg-[#c6f135] transition">
                          <IconC className="w-4 h-4" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-[#88b500] font-mono">
                            {item.step}
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                            {item.tag}
                          </span>
                        </div>
                        <div className="font-black text-xs uppercase tracking-tight text-black group-hover:text-[#7ba600] transition">
                          {item.name}
                        </div>
                        <p className="text-[10px] text-gray-500 font-sans leading-tight">
                          {item.desc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px] font-mono font-bold text-gray-400 group-hover:text-black uppercase">
                        <span>OPEN STEP</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 8. SECTION: RESOURCES & KNOWLEDGE HUB */}
            <section id="resources" className="space-y-6 pt-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#88b500] tracking-widest font-mono">
                    /// KNOWLEDGE & COMPLIANCE HUB
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black leading-tight mt-1">
                    PROCUREMENT STANDARDS
                    <br />
                    <span className="text-[#8cb800]">& RESOURCES.</span>
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mt-1">
                    Access official policies, compliance guidelines, materials catalog, and integration docs.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>UPDATED FOR 2026 AUDIT CYCLE</span>
                  </span>
                </div>
              </div>

              {/* 4 Resources Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "GLOBAL S2P POLICY 2026",
                    category: "GOVERNANCE",
                    desc: "Standard operating procedures for purchase requisitions, threshold multi-tier approvals, and competitive bidding rules.",
                    icon: BookOpen,
                    action: "VIEW POLICY",
                  },
                  {
                    title: "SUPPLIER CODE OF CONDUCT",
                    category: "COMPLIANCE",
                    desc: "Mandatory labor fairness, workplace safety, ZDHC zero chemical discharge, and sustainable packaging protocols.",
                    icon: ShieldCheck,
                    action: "DOWNLOAD PDF",
                  },
                  {
                    title: "SAP S/4HANA & EDI SPECS",
                    category: "INTEGRATION",
                    desc: "Technical documentation for RESTful OData API endpoints, electronic ASN dispatch, and automated e-Invoicing.",
                    icon: FileCode,
                    action: "API DOCS",
                  },
                  {
                    title: "MATERIAL MASTER CATALOG",
                    category: "SPECIFICATIONS",
                    desc: "Official Adidas specifications for Primeknit yarn, Boost EVA, sustainable synthetic leathers, and rubber outsoles.",
                    icon: FileCheck,
                    action: "EXPLORE CATALOG",
                  },
                ].map((res, idx) => {
                  const RIcon = res.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => setStep("portal")}
                      className="bg-white border border-gray-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-black transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-black group-hover:bg-[#c6f135] transition">
                            <RIcon className="w-5 h-5" />
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                            {res.category}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-black text-sm uppercase tracking-tight text-black group-hover:text-[#7ba600] transition">
                            {res.title}
                          </h3>
                          <p className="text-xs text-gray-500 font-sans leading-relaxed mt-1.5">
                            {res.desc}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between font-mono text-xs font-bold text-black group-hover:text-[#7ba600] uppercase">
                        <span>{res.action}</span>
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 9. SECTION: ABOUT ADIDAS GLOBAL PROCUREMENT */}
            <section id="about" className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center space-x-2 text-[#88b500] text-xs font-black uppercase tracking-widest font-mono">
                    <span className="text-[#a4d407] font-black">///</span>
                    <span>GLOBAL SOURCING EXCELLENCE</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black leading-tight">
                    ABOUT ADIDAS
                    <br />
                    <span className="text-[#8cb800]">PROCUREMENT OS.</span>
                  </h2>

                  <p className="text-gray-600 text-sm font-normal leading-relaxed">
                    At Adidas, procurement powers performance. We partner with world-class textile mills, component innovators, and sustainable material producers across 55+ countries to turn creative footwear concepts into high-precision athletic reality.
                  </p>

                  <p className="text-gray-600 text-sm font-normal leading-relaxed">
                    Our unified digital operating system replaces fragmented spreadsheets with end-to-end automation — connecting Demand Planning, RFQ Sourcing, Purchase Orders, Inbound Logistics, and 3-Way Matching into a single audited ledger.
                  </p>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="p-3 bg-[#fafaf9] border border-gray-200 rounded-xl font-mono text-center">
                      <div className="font-black text-xl text-black">€2.4B+</div>
                      <div className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Annual Managed Spend</div>
                    </div>
                    <div className="p-3 bg-[#fafaf9] border border-gray-200 rounded-xl font-mono text-center">
                      <div className="font-black text-xl text-emerald-600">99.2%</div>
                      <div className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Contract Compliance</div>
                    </div>
                    <div className="p-3 bg-[#fafaf9] border border-gray-200 rounded-xl font-mono text-center">
                      <div className="font-black text-xl text-black">55+</div>
                      <div className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Countries Sourced</div>
                    </div>
                  </div>
                </div>

                {/* 3 Pillar Feature Highlights */}
                <div className="lg:col-span-6 space-y-3.5">
                  <div className="p-4 bg-[#fafaf9] border border-gray-200 rounded-xl flex items-start space-x-3.5">
                    <div className="p-2.5 bg-white border border-gray-200 rounded-lg text-emerald-600 flex-shrink-0">
                      <Leaf className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-xs uppercase tracking-tight text-black">
                        SUSTAINABILITY & RECYCLED MATERIALS
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Commitment to 100% recycled polyester, zero deforestation leather supply chains, and transparent tier-1 to tier-3 ESG traceability.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#fafaf9] border border-gray-200 rounded-xl flex items-start space-x-3.5">
                    <div className="p-2.5 bg-white border border-gray-200 rounded-lg text-blue-600 flex-shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-xs uppercase tracking-tight text-black">
                        TRUSTED GLOBAL VENDOR ECOSYSTEM
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Seamless collaboration with suppliers via dedicated digital portals, automated RFQ submissions, and transparent SLA scorecards.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#fafaf9] border border-gray-200 rounded-xl flex items-start space-x-3.5">
                    <div className="p-2.5 bg-white border border-gray-200 rounded-lg text-black flex-shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-xs uppercase tracking-tight text-black">
                        ENTERPRISE AUDITABILITY & SOX COMPLIANCE
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Cryptographic audit trails for every requisition approval, purchase order amendment, goods receipt inspection, and payment batch.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 10. SECTION: CALL TO ACTION BANNER (Dark Adidas Pattern Banner) */}
            <section className="bg-black text-white p-8 sm:p-12 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-2 z-10">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight">
                  ONE SYSTEM.
                  <br />
                  EVERY PROCUREMENT DECISION.
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm font-sans max-w-lg">
                  Join Adidas and transform the way procurement powers performance.
                </p>
              </div>

              <button
                onClick={() => setStep("portal")}
                className="z-10 bg-black hover:bg-neutral-900 border-2 border-[#c6f135] text-[#c6f135] font-black text-xs uppercase tracking-widest px-8 py-4 rounded-sm flex items-center space-x-2 transition cursor-pointer font-mono flex-shrink-0"
              >
                <span>ENTER PROCUREMENT OS</span>
                <ArrowUpRight className="w-4 h-4 text-[#c6f135]" />
              </button>

              {/* Decorative Subtle Background Stripes */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none flex justify-end">
                <AdidasThreeBars className="w-full h-full text-white" />
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PORTAL SELECTION (INTERNAL vs EXTERNAL) */}
        {/* ========================================================================= */}
        {step === "portal" && (
          <div className="w-full space-y-8 text-center animate-fadeIn py-6">
            <div>
              <span className="font-mono text-xs font-black text-[#88b500] uppercase tracking-wider">
                PORTAL ENVIRONMENT SELECTION
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mt-1 text-black">
                CHOOSE ACCESS ENVIRONMENT
              </h2>
              <p className="text-gray-600 text-xs font-mono mt-1">
                Select internal corporate operations or external vendor portal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* INTERNAL PORTAL CARD */}
              <button
                onClick={() => handleSelectPortal("internal")}
                className="p-8 border-2 border-black bg-white hover:bg-black hover:text-white transition group text-left flex flex-col justify-between cursor-pointer shadow-xl rounded-2xl relative overflow-hidden"
              >
                <div>
                  <span className="bg-black text-white group-hover:bg-[#c6f135] group-hover:text-black font-mono font-bold text-xs px-2.5 py-1 uppercase rounded-sm">
                    INTERNAL CORPORATE PORTAL
                  </span>
                  <h3 className="text-2xl font-black uppercase mt-4 mb-2">
                    ADIDAS ENTERPRISE OS
                  </h3>
                  <p className="text-xs text-gray-600 group-hover:text-gray-300 leading-relaxed font-medium">
                    Access for Supply Chain Planners, Sourcing Specialists, Procurement Managers, Warehouse Officers, Accountants, and IT Admins.
                  </p>
                </div>
                <div className="mt-8 font-mono font-bold text-xs uppercase flex items-center space-x-1 group-hover:text-[#c6f135]">
                  <span>SELECT INTERNAL PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* EXTERNAL PORTAL CARD */}
              <button
                onClick={() => handleSelectPortal("external")}
                className="p-8 border-2 border-black bg-white hover:bg-black hover:text-white transition group text-left flex flex-col justify-between cursor-pointer shadow-xl rounded-2xl relative overflow-hidden"
              >
                <div>
                  <span className="bg-black text-white group-hover:bg-[#c6f135] group-hover:text-black font-mono font-bold text-xs px-2.5 py-1 uppercase rounded-sm">
                    EXTERNAL SUPPLIER PORTAL
                  </span>
                  <h3 className="text-2xl font-black uppercase mt-4 mb-2">
                    VENDOR & SUPPLIER NETWORK
                  </h3>
                  <p className="text-xs text-gray-600 group-hover:text-gray-300 leading-relaxed font-medium">
                    Dedicated bidding portal for material suppliers, textile mills, component manufacturers, and logistics partners.
                  </p>
                </div>
                <div className="mt-8 font-mono font-bold text-xs uppercase flex items-center space-x-1 group-hover:text-[#c6f135]">
                  <span>SELECT EXTERNAL PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>

            <button
              onClick={() => setStep("home")}
              className="text-xs font-mono font-bold uppercase underline hover:text-gray-600 cursor-pointer pt-4 inline-block"
            >
              &larr; BACK TO HOMEPAGE
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE SELECTION */}
        {/* ========================================================================= */}
        {step === "roles" && (
          <div className="w-full space-y-8 text-center animate-fadeIn py-6">
            <div>
              <span className="font-mono text-xs font-black text-[#88b500] uppercase tracking-wider">
                AUTHORIZATION PROFILE — {selectedPortal === "internal" ? "INTERNAL ROLES" : "VENDOR ACCESS"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mt-1 text-black">
                SELECT USER ROLE PROFILE
              </h2>
              <p className="text-gray-600 text-xs font-mono mt-1">
                Select your assigned user role profile to proceed to login authentication
              </p>
            </div>

            {selectedPortal === "internal" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {roleCredentials.filter(r => r.role !== "vendor").map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleSelectRole(item)}
                    className="p-6 border border-gray-200 bg-white hover:border-black hover:bg-black hover:text-white transition text-left cursor-pointer flex flex-col justify-between group shadow-sm rounded-xl"
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] font-bold text-gray-400 group-hover:text-gray-300 uppercase">
                          ROLE PROFILE
                        </span>
                        <span className="text-[10px] font-mono bg-gray-100 group-hover:bg-[#c6f135] text-black px-1.5 py-0.5 uppercase font-bold rounded-sm">
                          {item.role}
                        </span>
                      </div>
                      <h4 className="text-base font-black uppercase mt-2 mb-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-600 group-hover:text-gray-300">
                        {item.desc}
                      </p>
                    </div>
                    <div className="mt-6 pt-3 border-t border-gray-100 group-hover:border-neutral-800 flex justify-between items-center text-xs font-mono font-bold uppercase group-hover:text-[#c6f135]">
                      <span>LOGIN AS {item.role.toUpperCase()}</span>
                      <span>&rarr;</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                {roleCredentials.filter(r => r.role === "vendor").map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleSelectRole(item)}
                    className="p-8 border-2 border-black bg-white hover:bg-black hover:text-white transition text-left cursor-pointer w-full group shadow-xl rounded-2xl"
                  >
                    <span className="font-mono text-xs font-bold text-gray-400 group-hover:text-gray-300 uppercase">
                      VENDOR & SUPPLIER PROFILE
                    </span>
                    <h4 className="text-2xl font-black uppercase mt-2 mb-2">
                      {item.name}
                    </h4>
                    <p className="text-xs text-gray-600 group-hover:text-gray-300">
                      {item.desc}
                    </p>
                    <div className="mt-8 font-mono text-xs font-bold uppercase underline group-hover:text-[#c6f135]">
                      PROCEED TO VENDOR LOGIN &rarr;
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep("portal")}
              className="text-xs font-mono font-bold uppercase underline hover:text-gray-600 cursor-pointer pt-2 inline-block"
            >
              &larr; BACK TO PORTAL SELECTION
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LOGIN FORM */}
        {/* ========================================================================= */}
        {step === "login" && selectedRole && (
          <div className="w-full max-w-xl mx-auto space-y-6 animate-fadeIn py-6">
            <div className="text-center">
              <span className="font-mono text-xs font-black text-[#88b500] uppercase tracking-wider">
                ACCOUNT AUTHENTICATION
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 text-black">
                LOGIN FOR {selectedRole.toUpperCase()} ROLE
              </h2>
              <p className="text-xs font-mono text-gray-600 mt-0.5">
                Enter your account credentials to log into the Adidas Procurement OS
              </p>
            </div>

            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-6 sm:p-8 space-y-4 shadow-2xl rounded-2xl">
                {loginError && (
                  <div className="bg-red-50 border border-red-500 text-red-900 text-xs p-3 font-mono font-bold uppercase rounded">
                    AUTHENTICATION ERROR: {loginError}
                  </div>
                )}

                <div className="bg-gray-50 p-3.5 border border-gray-200 font-mono text-xs flex justify-between items-center rounded-lg">
                  <div>
                    <span className="text-gray-400 block uppercase text-[10px] font-bold">SELECTED ROLE:</span>
                    <span className="font-black text-black uppercase">{selectedRole}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("roles")}
                    className="text-xs font-bold uppercase underline hover:text-gray-600 cursor-pointer"
                  >
                    CHANGE
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-black mb-1">
                    USERNAME / ACCOUNT ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-gray-300 p-3 text-xs text-black font-mono font-bold focus:border-black focus:ring-1 focus:ring-black outline-none rounded-lg"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-black mb-1">
                    PASSWORD *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 p-3 text-xs text-black font-mono font-bold focus:border-black focus:ring-1 focus:ring-black outline-none rounded-lg"
                    placeholder="Enter password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#c6f135] hover:bg-[#b4e022] text-black font-mono font-black text-xs uppercase tracking-wider py-4 rounded-lg cursor-pointer transition disabled:opacity-50 shadow-md"
                >
                  {loading ? "AUTHENTICATING SECURITY CREDENTIALS..." : "CONFIRM & LOG INTO SYSTEM →"}
                </button>

                <div className="pt-2 flex justify-between text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setStep("roles")}
                    className="text-gray-600 font-bold hover:underline cursor-pointer"
                  >
                    &larr; BACK TO ROLES
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("home")}
                    className="text-gray-600 font-bold hover:underline cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </form>

              {/* DEMO CREDENTIALS CARD */}
              <div className="bg-white border border-gray-200 p-5 font-mono text-xs space-y-3 rounded-xl shadow-sm">
                <div className="font-black uppercase text-black border-b border-gray-100 pb-2 flex justify-between items-center">
                  <span>SYSTEM DEMO ACCOUNTS</span>
                  <span className="bg-[#c6f135] text-black text-[10px] px-2 py-0.5 font-bold rounded">DEFAULT PASSWORD: password123</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roleCredentials.map((item) => (
                    <div
                      key={item.role}
                      onClick={() => handleQuickAutoFill(item)}
                      className={`p-2.5 border rounded-lg cursor-pointer transition ${
                        selectedRole === item.role
                          ? "bg-black text-white border-black font-bold"
                          : "bg-gray-50 text-black border-gray-200 hover:border-black"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold uppercase text-[11px]">{item.name}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 bg-[#c6f135] text-black font-bold rounded">{item.role}</span>
                      </div>
                      <div className="text-[10px] mt-1 opacity-80">
                        User: <span className="font-mono underline">{item.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 11. FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-12 px-6 sm:px-10 text-xs text-gray-600 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Col 1: Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="text-black">
              <AdidasThreeBars className="w-8 h-6" />
            </div>
            <div className="font-black text-sm uppercase tracking-tight text-black">
              ADIDAS
              <br />
              PROCUREMENT OS
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              &copy; 2026 adidas. All rights reserved.
            </p>
          </div>

          {/* Col 2: Solutions */}
          <div className="space-y-2">
            <h4 className="font-black text-xs uppercase text-black font-mono tracking-wider">SOLUTIONS</h4>
            <ul className="space-y-1.5 text-xs text-gray-500">
              <li><button onClick={() => scrollToSection("features")} className="hover:text-black transition cursor-pointer">Demand Planning</button></li>
              <li><button onClick={() => scrollToSection("solutions")} className="hover:text-black transition cursor-pointer">Sourcing & RFQ</button></li>
              <li><button onClick={() => scrollToSection("solutions")} className="hover:text-black transition cursor-pointer">Purchase Orders</button></li>
              <li><button onClick={() => scrollToSection("solutions")} className="hover:text-black transition cursor-pointer">3-Way Matching</button></li>
              <li><button onClick={() => scrollToSection("suppliers")} className="hover:text-black transition cursor-pointer">Spend Analytics</button></li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div className="space-y-2">
            <h4 className="font-black text-xs uppercase text-black font-mono tracking-wider">RESOURCES</h4>
            <ul className="space-y-1.5 text-xs text-gray-500">
              <li><button onClick={() => scrollToSection("resources")} className="hover:text-black transition cursor-pointer">Global S2P Policy</button></li>
              <li><button onClick={() => scrollToSection("resources")} className="hover:text-black transition cursor-pointer">Supplier Code of Conduct</button></li>
              <li><button onClick={() => scrollToSection("resources")} className="hover:text-black transition cursor-pointer">SAP S/4HANA & EDI Specs</button></li>
              <li><button onClick={() => scrollToSection("resources")} className="hover:text-black transition cursor-pointer">Material Master Catalog</button></li>
            </ul>
          </div>

          {/* Col 4: Company */}
          <div className="space-y-2">
            <h4 className="font-black text-xs uppercase text-black font-mono tracking-wider">COMPANY</h4>
            <ul className="space-y-1.5 text-xs text-gray-500">
              <li><button onClick={() => scrollToSection("about")} className="hover:text-black transition cursor-pointer">About Adidas Procurement</button></li>
              <li><button onClick={() => scrollToSection("about")} className="hover:text-black transition cursor-pointer">Sustainability Commitments</button></li>
              <li><button onClick={() => scrollToSection("about")} className="hover:text-black transition cursor-pointer">Global Supply Network</button></li>
              <li><button onClick={() => setStep("portal")} className="hover:text-black transition cursor-pointer">Portal Access</button></li>
            </ul>
          </div>

          {/* Col 5: Follow Us */}
          <div className="space-y-2">
            <h4 className="font-black text-xs uppercase text-black font-mono tracking-wider">FOLLOW US</h4>
            <div className="flex items-center space-x-3 text-black pt-1">
              <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#c6f135] transition cursor-pointer font-bold text-[10px]">IG</span>
              <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#c6f135] transition cursor-pointer font-bold text-[10px]">IN</span>
              <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#c6f135] transition cursor-pointer font-bold text-[10px]">YT</span>
              <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#c6f135] transition cursor-pointer font-bold text-[10px]">X</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
