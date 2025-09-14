import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "API is handled by the FastAPI backend" });
}
