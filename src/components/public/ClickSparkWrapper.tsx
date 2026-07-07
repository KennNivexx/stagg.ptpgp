"use client";

import ClickSpark from "@/components/public/ClickSpark";

export default function ClickSparkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ClickSpark sparkColor="#dd2c00" sparkSize={8} sparkRadius={20} sparkCount={6} duration={500}>
      {children}
    </ClickSpark>
  );
}
