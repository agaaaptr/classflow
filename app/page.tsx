import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth";

export default async function Home() {
  const role = await getCurrentRole();
  if (!role) redirect("/login");
  redirect(role === "admin" ? "/admin" : role === "tutor" ? "/tutor" : "/student");
}
