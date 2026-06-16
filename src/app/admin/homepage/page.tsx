"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

export default function HomepageCMS() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] =
    useState("");
  const [heroImage, setHeroImage] = useState("");

  const [privateLabelTitle, setPrivateLabelTitle] =
    useState("");

  const [
    privateLabelDescription,
    setPrivateLabelDescription,
  ] = useState("");

  const [exportCountries, setExportCountries] =
    useState("");

  const [buyersCount, setBuyersCount] =
    useState("");

  useEffect(() => {
    loadHomepage();
  }, []);

  async function loadHomepage() {
    const { data } = await supabase
      .from("homepage")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      setHeroTitle(data.hero_title || "");
      setHeroDescription(
        data.hero_description || ""
      );
      setHeroImage(data.hero_image || "");

      setPrivateLabelTitle(
        data.private_label_title || ""
      );

      setPrivateLabelDescription(
        data.private_label_description || ""
      );

      setExportCountries(
        data.export_countries || ""
      );

      setBuyersCount(
        data.buyers_count || ""
      );
    }

    setLoading(false);
  }

  async function saveHomepage() {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("homepage")
        .update({
          hero_title: heroTitle,
          hero_description: heroDescription,
          hero_image: heroImage,

          private_label_title:
            privateLabelTitle,

          private_label_description:
            privateLabelDescription,

          export_countries:
            exportCountries,

          buyers_count: buyersCount,
        })
        .eq("id", 1);

      if (error) {
        alert(error.message);
        return;
      }

      alert(
        "Homepage Updated Successfully"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FFF8F5] flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF8F5] p-6 lg:p-10">
      <div className="max-w-[1200px] mx-auto">

        <h1 className="text-4xl font-black text-[#081325] mb-8">
          Homepage CMS
        </h1>

        <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-6">

          <div className="space-y-5">

            {/* HERO */}

            <div>
              <label className="block font-semibold mb-2">
                Hero Title
              </label>

              <input
                value={heroTitle}
                onChange={(e) =>
                  setHeroTitle(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-4"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Hero Description
              </label>

              <textarea
                value={heroDescription}
                onChange={(e) =>
                  setHeroDescription(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-4 h-40"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Hero Image URL
              </label>

              <input
                value={heroImage}
                onChange={(e) =>
                  setHeroImage(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-4"
              />
            </div>

            {heroImage && (
              <img
                src={heroImage}
                alt=""
                className="w-64 rounded-xl border"
              />
            )}

            <hr className="my-6" />

            {/* PRIVATE LABEL */}

            <div>
              <label className="block font-semibold mb-2">
                Private Label Title
              </label>

              <input
                value={privateLabelTitle}
                onChange={(e) =>
                  setPrivateLabelTitle(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-4"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Private Label Description
              </label>

              <textarea
                value={
                  privateLabelDescription
                }
                onChange={(e) =>
                  setPrivateLabelDescription(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-4 h-32"
              />
            </div>

            <hr className="my-6" />

            {/* EXPORT SECTION */}

            <div>
              <label className="block font-semibold mb-2">
                Export Countries
              </label>

              <input
                value={exportCountries}
                onChange={(e) =>
                  setExportCountries(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-4"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                International Buyers
              </label>

              <input
                value={buyersCount}
                onChange={(e) =>
                  setBuyersCount(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-4"
              />
            </div>

            <button
              onClick={saveHomepage}
              disabled={saving}
              className="bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-bold"
            >
              {saving
                ? "Saving..."
                : "Save Homepage"}
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}