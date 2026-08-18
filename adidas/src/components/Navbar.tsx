import React from "react";
import { User, UserRole } from "../types";
import { AdidasThreeBars } from "./Common/AdidasBrandLogos";
import { LogOut } from "lucide-react";

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onSwitchRole?: (role: UserRole) => void;
  activeModule: string;
}

const roleDisplayNames: Record<UserRole, string> = {
  planner: "Supply Chain Planner",
  sourcing: "Sourcing Specialist",
  manager: "Procurement Manager",
  warehouse: "Warehouse Clerk",
  accountant: "Accountant",
  admin: "System Admin",
  vendor: "Vendor / Supplier",
};

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onSwitchRole, activeModule }) => {
  return (
    <header className="bg-black text-white border-b border-neutral-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="text-white">
            <AdidasThreeBars className="w-8 h-6" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-black text-lg tracking-tight uppercase font-sans">
              ADIDAS
            </span>
            <span className="bg-[#c6f135] text-black text-[10px] font-black px-2 py-0.5 rounded-sm font-mono tracking-wider">
              PROCUREMENT OS
            </span>
          </div>
          <span className="hidden md:inline-block text-neutral-600 text-sm">|</span>
          <span className="hidden md:inline-block text-xs font-semibold uppercase tracking-wider text-neutral-300">
            {activeModule}
          </span>
        </div>

        {/* User Info & Controls */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          {/* User Badge */}
          {user && (
            <div className="flex flex-col text-right">
              <span className="font-black text-white uppercase tracking-tight font-sans text-xs">{user.fullName || user.username}</span>
              <span className="text-neutral-400 text-[10px] uppercase font-mono">
                {roleDisplayNames[user.role] || user.role} [{user.employeeId || "EMP"}]
              </span>
            </div>
          )}

          <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px] uppercase rounded-sm">
            {user?.portal === "external" || user?.role === "vendor" ? "EXTERNAL PORTAL" : "INTERNAL PORTAL"}
          </span>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="bg-[#c6f135] hover:bg-[#b4e022] text-black font-black px-3.5 py-1.5 uppercase tracking-wider transition cursor-pointer flex items-center space-x-1 rounded-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-black" />
            <span>LOGOUT</span>
          </button>
        </div>

      </div>
    </header>
  );
};
