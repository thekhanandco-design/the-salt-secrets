import Link from "next/link";
import {
  Leaf,
  FlaskConical,
  Truck,
  PackageCheck,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-[#fff8f5]">
      <div className="max-w-7xl mx-auto px-5 lg:px-6 pt-8 pb-10">
        <div className="relative overflow-hidden rounded-[28px] min-h-[560px] bg-[url('/hero-banner.png')] bg-contain bg-right-bottom bg-no-repeat">
          <div className="absolute inset-0 bg-gradient-to-r from-[#fff8f5] via-[#fff8f5]/90 to-transparent" />

          <div className="relative z-10 max-w-2xl px-4 lg:px-0 py-20">
            <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
              Premium Himalayan Pink Salt
            </span>

            <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] text-[#07142B]">
              Reliable Supply.
              <br />
              <span className="text-[#C23B4A]">
                Premium Quality.
              </span>
            </h1>

            <p className="mt-6 text-slate-600 text-base lg:text-lg leading-relaxed max-w-xl">
              Leading manufacturer and exporter of 100% natural Himalayan Pink
              Salt for distributors, wholesalers, retailers and private label
              brands worldwide.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                href="/products"
                className="bg-[#C23B4A] text-white px-7 py-4 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Explore Products →
              </Link>

              <Link
                href="/contact"
                className="bg-white border border-[#E8D2D6] text-[#07142B] px-7 py-4 rounded-lg font-semibold hover:bg-[#fff4f6] transition"
              >
                Get Quote →
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10 max-w-3xl">
              <div>
                <Leaf className="w-6 h-6 text-[#C23B4A] mb-2" />
                <h3 className="font-bold text-sm">100% Natural</h3>
                <p className="text-xs text-slate-500">No Additives</p>
              </div>

              <div>
                <FlaskConical className="w-6 h-6 text-[#C23B4A] mb-2" />
                <h3 className="font-bold text-sm">Lab Tested</h3>
                <p className="text-xs text-slate-500">Premium Quality</p>
              </div>

              <div>
                <Truck className="w-6 h-6 text-[#C23B4A] mb-2" />
                <h3 className="font-bold text-sm">On-Time Delivery</h3>
                <p className="text-xs text-slate-500">Worldwide</p>
              </div>

              <div>
                <PackageCheck className="w-6 h-6 text-[#C23B4A] mb-2" />
                <h3 className="font-bold text-sm">Private Label</h3>
                <p className="text-xs text-slate-500">Custom Branding</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}