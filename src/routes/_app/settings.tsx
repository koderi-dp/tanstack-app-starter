import { createFileRoute } from "@tanstack/react-router";
import { Bell, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, NumberInput, SwitchField } from "@/ui/form";
import { notify } from "@/ui/notify";
import { PageHeader } from "@/ui/page-header";
import { PageShell } from "@/ui/page-shell";
import { Input } from "@/ui/primitives/input";
import { SettingsSaveFooter, SettingsSectionLayout } from "@/ui/settings-section";

const SECTIONS = [
  { id: "general", label: "General", description: "Name and defaults", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", description: "What raises a toast", icon: Bell },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

type Form = { name: string; workers: number; notifyOnChange: boolean };

const INITIAL: Form = { name: "Starter", workers: 4, notifyOnChange: true };

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [section, setSection] = useState<SectionId>("general");
  const [form, setForm] = useState<Form>(INITIAL);
  const [saved, setSaved] = useState<Form>(INITIAL);
  const [isSaving, setSaving] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!dirty) return;
    setSaving(true);
    // A real app would await a server function here.
    setTimeout(() => {
      setSaving(false);
      setSaved(form);
      notify.saved("Settings");
    }, 600);
  }

  return (
    <PageShell gap="loose">
      <PageHeader
        kicker="Configuration"
        title="Settings"
        description="Sections on the left, one form at a time, and a footer that knows if it is dirty."
      />
      <form
        onSubmit={onSubmit}
        className="flex min-h-[28rem] flex-col overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]"
      >
        <SettingsSectionLayout
          label="Settings sections"
          sections={SECTIONS}
          activeSection={section}
          onSectionChange={setSection}
        >
          {section === "general" ? (
            <div className="grid gap-4">
              <Field label="Name" hint="Used in the window title and the palette.">
                <Input
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  aria-label="Name"
                />
              </Field>
              <Field label="Workers">
                <NumberInput
                  value={form.workers}
                  onChange={(value) => set("workers", value)}
                  min={1}
                  max={16}
                  aria-label="Workers"
                />
              </Field>
            </div>
          ) : (
            <div className="grid gap-4">
              <SwitchField
                checked={form.notifyOnChange}
                onCheckedChange={(value) => set("notifyOnChange", value)}
                label="Toast on every change"
                description="Off means only failures are announced."
              />
            </div>
          )}
        </SettingsSectionLayout>
        <SettingsSaveFooter
          dirty={dirty}
          isSaving={isSaving}
          submitLabel="Save settings"
          onCancel={() => setForm(saved)}
        />
      </form>
    </PageShell>
  );
}
