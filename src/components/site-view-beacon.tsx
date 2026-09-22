"use client";

import { useEffect } from "react";
import { recordSiteOpen } from "@/lib/views-client";

/** Records a page open without rendering anything. */
export function SiteViewBeacon() {
  useEffect(() => {
    void recordSiteOpen();
  }, []);
  return null;
}
