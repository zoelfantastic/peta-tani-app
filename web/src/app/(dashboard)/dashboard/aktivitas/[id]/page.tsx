export function generateStaticParams() {
  return ["1", "2", "3", "4", "5", "6", "7", "8"].map((id) => ({ id }));
}

import DetailAktivitasClient from "./_client";

export default function Page() {
  return <DetailAktivitasClient />;
}
