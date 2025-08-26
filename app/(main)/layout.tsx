import type { ReactNode } from "react"

export default function MainLayout({ children }: { children: ReactNode }) {
	// This segment layout can wrap main app pages if needed. For now, just render children.
	return <>{children}</>
}

