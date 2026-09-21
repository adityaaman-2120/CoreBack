import SignIn from "./signin-form";
export const metadata = { title: "Sign in · CoreBack" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  return (
    <SignIn initialMode={params.mode === "signup" ? "signup" : "signin"} />
  );
}
