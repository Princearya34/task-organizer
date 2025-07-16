import dynamic from "next/dynamic";

const MainApp = dynamic(() => import("./MainApp"), { ssr: false });

export default function Page() {
  return <MainApp />;
}
