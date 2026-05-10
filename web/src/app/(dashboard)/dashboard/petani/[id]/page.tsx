export function generateStaticParams() {
  return ["1", "2", "3", "4", "5"].map((id) => ({ id }));
}

import DetailPetaniClient from "./_client";

export default function Page() {
  return <DetailPetaniClient />;
}
