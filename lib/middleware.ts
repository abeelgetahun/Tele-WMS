import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "./auth"

export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    try {
      const token = request.headers.get("authorization")?.replace("Bearer ", "")

      if (!token) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      const payload = verifyJWT(token)
      if (!payload) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
      }

      // Add user info to request
      const requestWithUser = request as NextRequest & { user: any }
      requestWithUser.user = payload

      return handler(requestWithUser)
    } catch (error) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }
}
