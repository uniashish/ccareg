import React, { useMemo } from "react";
import { FiTool } from "react-icons/fi";
import LimitManager from "./LimitManager";
import TermManager from "./TermManager";
import AdminContactManager from "./AdminContactManager";
import EmailTemplateManager from "./EmailTemplateManager";
import BankDetailsManager from "./BankDetailsManager"; // <--- NEW IMPORT

export default function HousekeepingManager({
  selections,
  users,
  classesList,
}) {
  const classMap = useMemo(() => {
    return (classesList || []).reduce((acc, cls) => {
      acc[cls.id] = cls;
      return acc;
    }, {});
  }, [classesList]);

  return (
    <div className="w-full h-full">
      <div className="h-[75vh] overflow-y-auto pr-2 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. SELECTION LIMITS */}
          <LimitManager />

          {/* 2. ADMIN CONTACT */}
          <AdminContactManager />

          {/* 3. EMAIL TEMPLATE MANAGER */}
          <EmailTemplateManager />

          {/* 4. BANK DETAILS MANAGER (NEW) */}
          <BankDetailsManager />

          {/* 5. DANGER ZONE (Moved to end) */}
          <TermManager
            selections={selections}
            users={users}
            classMap={classMap}
          />
        </div>
      </div>
    </div>
  );
}
