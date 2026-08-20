"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import Turnstile from "@/components/security/Turnstile";

const PRODUCT_CATEGORIES = [
  "Edible Salt",
  "Salt Lamps",
  "Salt Tiles / Bricks",
  "Cooking Plates / Slabs",
  "Animal Lick Salt",
  "Bulk & Raw Salt",
] as const;

const QUANTITY_OPTIONS = [
  "Sample / Trial Order",
  "Under 500 kg",
  "500 kg – 1 MT",
  "1 – 5 MT",
  "5 – 10 MT",
  "10 – 25 MT",
  "25 – 50 MT",
  "50+ MT",
  "Full Container Load",
  "Not Sure Yet",
] as const;

const ANNUAL_VOLUME_OPTIONS = [
  "Starter – Under 10,000 units",
  "10,000 – 50,000 units",
  "50,000 – 100,000 units",
  "100,000 – 250,000 units",
  "250,000 – 500,000 units",
  "500,000+ units",
  "Not Sure Yet",
] as const;

const PRIVATE_LABEL_OPTIONS = ["Yes", "No", "Not Sure Yet"] as const;
const INCOTERM_OPTIONS = ["EXW", "FOB", "CFR", "CIF", "DDP", "Not Sure / Please Advise"] as const;

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo, Democratic Republic of the","Congo, Republic of the","Costa Rica","Cote d'Ivoire","Croatia","Cuba","Cyprus","Czechia","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
] as const;

type CountryComboboxProps = {
  value: string;
  onChange: (value: string) => void;
};

function CountryCombobox({ value, onChange }: CountryComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return COUNTRIES;
    return COUNTRIES.filter((country) => country.toLowerCase().includes(normalized));
  }, [query]);

  function choose(country: string) {
    setQuery(country);
    onChange(country);
    setOpen(false);
    setActiveIndex(0);
  }

  return (
    <div className="tso-country-combobox">
      <input type="hidden" name="target_market" value={value} />
      <input
        type="text"
        value={query}
        placeholder="Search or select country"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="target-market-listbox"
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          const exact = COUNTRIES.find((country) => country.toLowerCase() === next.trim().toLowerCase()) || "";
          onChange(exact);
          setOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            setOpen(true);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => Math.min(current + 1, Math.max(0, filtered.length - 1)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
          } else if (event.key === "Enter" && open && filtered[activeIndex]) {
            event.preventDefault();
            choose(filtered[activeIndex]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open ? (
        <div id="target-market-listbox" className="tso-country-options" role="listbox">
          {filtered.length ? filtered.map((country, index) => (
            <button
              type="button"
              role="option"
              aria-selected={value === country}
              className={index === activeIndex ? "active" : ""}
              key={country}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(country)}
            >
              {country}
            </button>
          )) : <div className="tso-country-empty">No country found</div>}
        </div>
      ) : null}
    </div>
  );
}

type ProductMultiSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

function ProductMultiSelect({ value, onChange }: ProductMultiSelectProps) {
  const [open, setOpen] = useState(false);

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  const summary = value.length === 0
    ? "Select one or more categories"
    : value.length === 1
      ? value[0]
      : `${value.length} categories selected`;

  return (
    <div className="tso-product-multiselect" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <button
        type="button"
        className="tso-product-multiselect__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={value.length ? "selected" : ""}>{summary}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <div className="tso-product-multiselect__menu" role="listbox" aria-multiselectable="true">
          {PRODUCT_CATEGORIES.map((option) => {
            const checked = value.includes(option);
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={checked}
                className={checked ? "is-selected" : ""}
                onClick={() => toggle(option)}
              >
                <span className="tso-product-multiselect__check">{checked ? <Check aria-hidden="true" /> : null}</span>
                <span>{option}</span>
              </button>
            );
          })}
          <div className="tso-product-multiselect__hint">Select all categories that apply.</div>
        </div>
      ) : null}
    </div>
  );
}

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileStatus, setTurnstileStatus] = useState<"loading" | "ready" | "verified" | "error" | "unconfigured">("loading");
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [targetMarket, setTargetMarket] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const onTurnstile = useCallback((token: string) => setTurnstileToken(token), []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(false);
    setError("");

    if (!selectedCategories.length) {
      setError("Please select at least one product category.");
      return;
    }

    if (!turnstileToken) {
      setError(turnstileStatus === "unconfigured"
        ? "Security verification is not configured on this deployment."
        : turnstileStatus === "error"
          ? "Security verification could not load. Refresh the page and try again."
          : "Please wait for the security check to complete, then submit again.");
      return;
    }

    setLoading(true);
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          company: formData.get("company"),
          phone: formData.get("phone"),
          productCategories: selectedCategories,
          estimatedQuantity: formData.get("estimated_quantity"),
          estimatedAnnualVolume: formData.get("estimated_annual_volume"),
          privateLabelRequired: formData.get("private_label_required"),
          targetMarket: formData.get("target_market"),
          incotermPreference: formData.get("incoterm_preference"),
          message: formData.get("message"),
          website: formData.get("website"),
          turnstileToken,
        }),
      });

      const result = await response.json().catch(() => ({}));
      setTurnstileToken("");
      setTurnstileResetSignal((current) => current + 1);

      if (response.ok) {
        setSuccess(true);
        setTargetMarket("");
        setSelectedCategories([]);
        form.reset();
      } else {
        setError(result.error || "Quote request could not be sent.");
      }
    } catch {
      setTurnstileToken("");
      setTurnstileResetSignal((current) => current + 1);
      setError("Quote request could not be sent. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="tso-contact-form-title">
        <div className="tso-eyebrow">B2B Quote Request</div>
        <h2>Tell us what you need.</h2>
      </div>
      {success ? <div className="tso-contact-alert success">Quote request received. Our team will contact you shortly.</div> : null}
      {error ? <div className="tso-contact-alert error">{error}</div> : null}

      <form onSubmit={handleSubmit} className="tso-contact-form-grid">
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="tso-honeypot" />

        <label><span>Full Name</span><input name="name" type="text" required autoComplete="name" /></label>
        <label><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
        <label><span>Company Name <i>Optional</i></span><input name="company" type="text" autoComplete="organization" /></label>
        <label><span>Phone Number <i>Optional</i></span><input name="phone" type="tel" autoComplete="tel" /></label>

        <div className="tso-product-category-field">
          <span>Product Category</span>
          <ProductMultiSelect value={selectedCategories} onChange={setSelectedCategories} />
        </div>

        <label>
          <span>Estimated Quantity</span>
          <select name="estimated_quantity" required defaultValue="">
            <option value="" disabled>Select estimated quantity</option>
            {QUANTITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <label>
          <span>Estimated Annual Volume</span>
          <select name="estimated_annual_volume" required defaultValue="">
            <option value="" disabled>Select expected yearly volume</option>
            {ANNUAL_VOLUME_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <label>
          <span>Private Label Required</span>
          <select name="private_label_required" required defaultValue="">
            <option value="" disabled>Select an option</option>
            {PRIVATE_LABEL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <label>
          <span>Target Market <i>Optional</i></span>
          <CountryCombobox key={targetMarket || "empty"} value={targetMarket} onChange={setTargetMarket} />
        </label>

        <label>
          <span>Incoterm Preference <i>Optional</i></span>
          <select name="incoterm_preference" defaultValue="">
            <option value="">Select incoterm</option>
            {INCOTERM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <label className="full"><span>Message</span><textarea name="message" required rows={5} /></label>
        <div className="full tso-contact-turnstile"><Turnstile action="contact_form" onToken={onTurnstile} onStatusChange={setTurnstileStatus} resetSignal={turnstileResetSignal} /></div>
        <button className="full tso-contact-submit" disabled={loading} type="submit"><span>{loading ? "Sending…" : "Request Quote"}</span></button>
      </form>
    </>
  );
}
