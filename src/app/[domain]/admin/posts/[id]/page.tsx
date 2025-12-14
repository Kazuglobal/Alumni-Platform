import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";
import { auth } from "@/auth";
import { PostForm } from "../post-form";
import { getCategories } from "../actions";

async function getPost(tenantId: string, postId: string) {
  return prisma.post.findFirst({
    where: { id: postId, tenantId },
  });
}

export default async function EditPostPage({
  params,
}: {
  params: { domain: string; id: string };
}) {
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    notFound();
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [post, categories] = await Promise.all([
    getPost(tenant.id, params.id),
    getCategories(tenant.id),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <PostForm
      tenantId={tenant.id}
      authorId={session.user.id}
      categories={categories}
      post={post}
    />
  );
}
