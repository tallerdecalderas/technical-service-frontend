import { NextResponse, type NextRequest } from "next/server"
import { forwardAuthRequest } from "@/lib/auth-api"

export async function POST(request: NextRequest) {
  try {
    return await forwardAuthRequest(request, "logout", "POST")
  } catch {
    return NextResponse.json(
      { success: false, error: "El servicio de autenticación no está disponible." },
      { status: 502 }
    )
  }
}
