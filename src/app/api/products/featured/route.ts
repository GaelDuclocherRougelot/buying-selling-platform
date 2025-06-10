import { getLastTenProducts } from "@/services/product";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const products = await getLastTenProducts();
        return NextResponse.json(products);
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
