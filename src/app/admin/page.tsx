import Link from "next/link";

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-[#FFF8F5] p-6 lg:p-10">
      <div className="max-w-[1400px] mx-auto">

        <h1 className="text-5xl font-black text-[#081325] mb-10">
          Admin Dashboard
        </h1>

        <div className="grid md:grid-cols-2 gap-6">

          <Link
            href="/admin/inquiries"
            className="bg-white border border-[#EFE3E5] rounded-[24px] p-8 hover:shadow-lg transition"
          >
            <h2 className="text-3xl font-black text-[#081325]">
              Inquiries
            </h2>

            <p className="text-slate-600 mt-3">
              View all customer inquiries.
            </p>
          </Link>

          <Link
            href="/admin/products"
            className="bg-white border border-[#EFE3E5] rounded-[24px] p-8 hover:shadow-lg transition"
          >
            <h2 className="text-3xl font-black text-[#081325]">
              Products
            </h2>

            <p className="text-slate-600 mt-3">
              Manage products, images and details.
            </p>
          </Link>

        </div>

      </div>
    </main>
  );
}