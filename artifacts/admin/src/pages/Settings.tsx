import { useEffect, useState, useRef } from "react";
import { useAdminFetch } from "@/contexts/AuthContext";

interface AppSettings {
  app_tagline: string;
  hero_title: string;
  hero_subtitle: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  banner_url: string;
  announcement: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  app_tagline: "The Earth's Apothecary",
  hero_title: "Nigerian Wellness Cuisine",
  hero_subtitle: "Food as Medicine, Culture as Cure",
  primary_color: "#154212",
  secondary_color: "#8b500a",
  logo_url: "",
  banner_url: "",
  announcement: "",
};

export default function Settings() {
  const apiFetch = useAdminFetch();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saved, setSaved] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (
    file: File,
    field: "logo_url" | "banner_url",
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const res = await apiFetch("/api/admin/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64,
            filename: `${field}-${Date.now()}.${file.name.split(".").pop()}`,
            contentType: file.type,
          }),
        });
        const data = await res.json();
        if (data.url) setSettings((s) => ({ ...s, [field]: data.url }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">App Settings</h1>
          <p className="text-muted-foreground mt-1">Control branding, captions, and appearance</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <span>✓</span>
          ) : (
            <span>💾</span>
          )}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Branding Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">Branding Colors</h2>
            <p className="text-sm text-muted-foreground mb-4">
              These colors are applied throughout the mobile app and portals.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings((s) => ({ ...s, primary_color: e.target.value }))}
                    className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => setSettings((s) => ({ ...s, primary_color: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div
                    className="w-10 h-10 rounded-lg border border-border"
                    style={{ backgroundColor: settings.primary_color }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Secondary / Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings((s) => ({ ...s, secondary_color: e.target.value }))}
                    className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings((s) => ({ ...s, secondary_color: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div
                    className="w-10 h-10 rounded-lg border border-border"
                    style={{ backgroundColor: settings.secondary_color }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">App Captions</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Update the text shown in the app onboarding and home screens.
            </p>
            <div className="space-y-4">
              <Field
                label="App Tagline"
                hint={"Shown under the logo (e.g. \"The Earth's Apothecary\")"}
                value={settings.app_tagline}
                onChange={(v) => setSettings((s) => ({ ...s, app_tagline: v }))}
              />
              <Field
                label="Hero Title"
                hint="Main headline on the home screen"
                value={settings.hero_title}
                onChange={(v) => setSettings((s) => ({ ...s, hero_title: v }))}
              />
              <Field
                label="Hero Subtitle"
                hint="Supporting text below the hero title"
                value={settings.hero_subtitle}
                onChange={(v) => setSettings((s) => ({ ...s, hero_subtitle: v }))}
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Announcement Banner
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Optional. Shown as a top banner in the app. Leave empty to hide.
                </p>
                <textarea
                  value={settings.announcement}
                  onChange={(e) => setSettings((s) => ({ ...s, announcement: e.target.value }))}
                  rows={2}
                  placeholder="E.g. New: Free delivery on orders over ₦5,000 this weekend!"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">Images & Media</h2>
            <p className="text-sm text-muted-foreground mb-4">Upload images used in the app.</p>

            <div className="space-y-5">
              <ImageUploader
                label="App Logo"
                hint="Shown in the header. Recommended: 200×200px, PNG with transparency."
                currentUrl={settings.logo_url}
                uploading={uploadingLogo}
                inputRef={logoRef}
                onSelect={(file) => handleImageUpload(file, "logo_url", setUploadingLogo)}
                onClear={() => setSettings((s) => ({ ...s, logo_url: "" }))}
              />

              <ImageUploader
                label="Hero Banner"
                hint="Background image for the home screen. Recommended: 1200×400px."
                currentUrl={settings.banner_url}
                uploading={uploadingBanner}
                inputRef={bannerRef}
                onSelect={(file) => handleImageUpload(file, "banner_url", setUploadingBanner)}
                onClear={() => setSettings((s) => ({ ...s, banner_url: "" }))}
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3">Preview</h2>
            <div
              className="rounded-2xl overflow-hidden border border-border shadow-sm"
              style={{ background: `linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.primary_color}cc 100%)` }}
            >
              <div className="p-6 text-white">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover mb-3" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl mb-3">🌿</div>
                )}
                <div className="text-base font-bold">Fittrac Kitchen</div>
                <div className="text-sm text-white/70 mb-3">{settings.app_tagline || "The Earth's Apothecary"}</div>
                <div className="text-2xl font-bold leading-tight">{settings.hero_title || "Nigerian Wellness Cuisine"}</div>
                <div className="text-sm text-white/80 mt-1">{settings.hero_subtitle || "Food as Medicine, Culture as Cure"}</div>
              </div>
              {settings.announcement && (
                <div style={{ backgroundColor: settings.secondary_color }} className="px-6 py-2 text-white text-sm font-medium">
                  📢 {settings.announcement}
                </div>
              )}
            </div>
          </div>

          {/* Notification Config */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">Email Notifications</h2>
            <p className="text-sm text-muted-foreground mb-3">Configure Amazon SES for transactional emails.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-base mt-0.5">⚠️</span>
                <div>
                  <div className="text-sm font-semibold text-amber-800">AWS SES credentials required</div>
                  <div className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Set the following environment secrets to enable email delivery:
                    <code className="block mt-1 font-mono">AWS_ACCESS_KEY_ID</code>
                    <code className="block font-mono">AWS_SECRET_ACCESS_KEY</code>
                    <code className="block font-mono">AWS_REGION</code>
                    <code className="block font-mono">SES_FROM_EMAIL</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <p className="text-xs text-muted-foreground mb-1.5">{hint}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function ImageUploader({
  label,
  hint,
  currentUrl,
  uploading,
  inputRef,
  onSelect,
  onClear,
}: {
  label: string;
  hint: string;
  currentUrl: string;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <p className="text-xs text-muted-foreground mb-2">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
        }}
      />
      {currentUrl ? (
        <div className="relative inline-block">
          <img
            src={currentUrl}
            alt={label}
            className="w-full max-w-xs h-32 object-cover rounded-xl border border-border"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all text-sm disabled:opacity-60"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <span className="text-base">📤</span>
              Upload {label}
            </>
          )}
        </button>
      )}
    </div>
  );
}
