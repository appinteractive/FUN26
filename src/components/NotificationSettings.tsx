import { useStore } from "@nanostores/react"
import { Bell, CalendarArrowDown } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { downloadIcs } from "@/lib/ics"
import { ensurePermission, notificationsSupported } from "@/lib/notifications"
import { $favorites, $reminderSettings } from "@/lib/stores"
import type { SessionLite } from "@/lib/types"

const LEAD_CHOICES = [5, 10, 15, 30]

export function NotificationSettings({
  sessions,
}: {
  sessions: SessionLite[]
}) {
  const settings = useStore($reminderSettings)
  const favorites = useStore($favorites)
  const [denied, setDenied] = useState(
    () =>
      typeof Notification !== "undefined" &&
      Notification.permission === "denied"
  )
  const supported = notificationsSupported()

  async function handleEnable(enabled: boolean) {
    if (!enabled) {
      $reminderSettings.set({ ...settings, enabled: false })
      return
    }
    const granted = await ensurePermission()
    setDenied(!granted && Notification.permission === "denied")
    $reminderSettings.set({ ...settings, enabled: granted })
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="icon" aria-label="Reminder settings">
            <Bell />
          </Button>
        }
      />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>My schedule</DialogTitle>
          <DialogDescription>
            Reminders and calendar export for your favorited sessions.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Enable reminders</FieldTitle>
              <FieldDescription>
                Uses browser notifications on this device.
              </FieldDescription>
            </FieldContent>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => void handleEnable(checked)}
              disabled={!supported}
            />
          </Field>

          <Field>
            <FieldLabel>Remind me before each session</FieldLabel>
            <ToggleGroup
              value={[String(settings.leadMinutes)]}
              onValueChange={(value: unknown[]) => {
                const pick = Number(value[0])
                if (LEAD_CHOICES.includes(pick)) {
                  $reminderSettings.set({ ...settings, leadMinutes: pick })
                }
              }}
              variant="outline"
            >
              {LEAD_CHOICES.map((minutes) => (
                <ToggleGroupItem key={minutes} value={String(minutes)}>
                  {minutes} min
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        </FieldGroup>

        {!supported && (
          <Alert>
            <AlertTitle>Notifications unavailable</AlertTitle>
            <AlertDescription>
              This browser does not support notifications. Use the calendar
              export below instead.
            </AlertDescription>
          </Alert>
        )}
        {denied && (
          <Alert>
            <AlertTitle>Notifications blocked</AlertTitle>
            <AlertDescription>
              Allow notifications for this site in your browser settings, or use
              the calendar export below.
            </AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-muted-foreground">
          Web reminders fire while the app is open (or installed and running in
          the background). For guaranteed reminders, add your favorites to your
          calendar:
        </p>

        <Separator />

        <Button
          variant="outline"
          disabled={favorites.length === 0}
          onClick={() =>
            downloadIcs(sessions.filter((s) => favorites.includes(s.slug)))
          }
        >
          <CalendarArrowDown data-icon="inline-start" />
          Export {favorites.length || "—"} favorite
          {favorites.length === 1 ? "" : "s"} (.ics)
        </Button>
      </DialogContent>
    </Dialog>
  )
}
