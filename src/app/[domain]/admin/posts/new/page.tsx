import { notFound, redirect } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";
import { auth } from "@/auth";
import { PostForm } from "../post-form";
import { getCategories } from "../actions";

export default async function NewPostPage({
  params,
}: {
  params: { domain: string };
}) {
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    notFound();
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const categories = await getCategories(tenant.id);

  return (
    <PostForm
      tenantId={tenant.id}
      authorId={session.user.id}
      categories={categories}
    />
  );
}
