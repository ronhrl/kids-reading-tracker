import { notFound } from "next/navigation"
import { ReadingGamePage, type UserId } from "../page"

const validUsers: UserId[] = ["roei", "yair"]

export function generateStaticParams() {
  return validUsers.map((user) => ({ user }))
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ user: string }>
}) {
  const { user } = await params

  if (!validUsers.includes(user as UserId)) {
    notFound()
  }

  return <ReadingGamePage userId={user as UserId} />
}
