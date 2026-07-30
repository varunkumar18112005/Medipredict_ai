"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "../../../services/api";
import HospitalLocator from "../../../components/maps/HospitalLocator";

export default function DiagnosticCentersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    setUser(activeUser);
  }, [router]);

  if (!user) return null;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "10px 10px 40px" }}>
      <HospitalLocator />
    </div>
  );
}
