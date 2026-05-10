export function generateStaticParams() {
  return ["1", "2", "3", "4", "5", "6"].map((id) => ({ id }));
}

import DetailLahanClient from "./_client";

export default function Page() {
  return <DetailLahanClient />;
}
