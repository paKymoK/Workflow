import { useState } from "react";
import { Button, Card, Form, Input, Select, Switch, Tabs, Typography } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { dynamicStyle } from "../../utils/dynamicStyle";

const NOTIFICATION_TEMPLATES = [
  {
    name: "Leave Approval Notification",
    trigger: "When leave request is approved/rejected",
    preview: "Dear {employee_name}, your {leave_type} leave from {from_date} to {to_date} has been {status}.",
  },
  {
    name: "New Announcement Alert",
    trigger: "When a new announcement is published",
    preview: "Hi {employee_name}, a new announcement '{title}' has been published. Tap to read.",
  },
  {
    name: "IT Ticket Update",
    trigger: "When ticket status changes",
    preview: "Your IT ticket {ticket_id} has been updated to '{status}' by {agent_name}.",
  },
  {
    name: "Survey Reminder",
    trigger: "3 days before survey closes",
    preview: "Reminder: Please complete '{survey_title}' by {close_date}.",
  },
];

const SECURITY_TOGGLES = [
  { key: "twoFactor", label: "Two-Factor Authentication", desc: "Require 2FA for Admin accounts" },
  { key: "passwordPolicy", label: "Password Strength Policy", desc: "Enforce strong password requirements" },
  { key: "auditLogging", label: "Audit Logging", desc: "Log all admin actions for compliance" },
] as const;

export default function Settings() {
  const [themeColor, setThemeColor] = useState("#1565C0");
  const [securityState, setSecurityState] = useState<Record<string, boolean>>({
    twoFactor: true,
    passwordPolicy: true,
    auditLogging: true,
  });
  const [sessionTimeout, setSessionTimeout] = useState("30 minutes");

  const toggleSecurity = (key: string) =>
    setSecurityState((prev) => ({ ...prev, [key]: !prev[key] }));

  const generalTab = (
    <div className="space-y-4">
      <Card title="Brand & Appearance">
        <Form layout="vertical" className="max-w-md">
          <Form.Item label="Company Logo">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] font-bold text-sm flex-shrink-0">
                CMC
              </div>
              <Button>Change Logo</Button>
            </div>
          </Form.Item>
          <Form.Item label="Company Name">
            <Input defaultValue="CMC Global" className="max-w-xs" />
          </Form.Item>
          <Form.Item label="Primary Theme Color">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg border border-[var(--border)] flex-shrink-0"
                style={dynamicStyle({ backgroundColor: themeColor })}
              />
              <Input
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="max-w-[120px] font-mono"
              />
            </div>
          </Form.Item>
          <Form.Item label="Default Language">
            <Select
              defaultValue="English"
              className="max-w-xs !w-full"
              options={["English", "Bahasa Indonesia", "Vietnamese"].map((o) => ({ value: o, label: o }))}
            />
          </Form.Item>
        </Form>
      </Card>
      <div className="flex justify-end">
        <Button type="primary">Save Changes</Button>
      </div>
    </div>
  );

  const notificationsTab = (
    <div className="space-y-4">
      <Card title="Notification Templates">
        <div className="space-y-4">
          {NOTIFICATION_TEMPLATES.map((n) => (
            <div key={n.name} className="p-4 border border-[var(--border)] rounded-xl">
              <div className="flex items-start justify-between mb-2 gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text)]">{n.name}</h4>
                  <p className="text-xs text-[var(--text-faint)] mt-0.5">Trigger: {n.trigger}</p>
                </div>
                <Button type="text" size="small" icon={<EditOutlined />}>
                  Edit
                </Button>
              </div>
              <p className="text-xs text-[var(--text-dim)] bg-[var(--hover)] rounded-lg p-2.5 font-mono leading-relaxed">
                {n.preview}
              </p>
            </div>
          ))}
        </div>
      </Card>
      <div className="flex justify-end">
        <Button type="primary">Save Templates</Button>
      </div>
    </div>
  );

  const securityTab = (
    <div className="space-y-4">
      <Card title="Security Settings">
        <div className="divide-y divide-[var(--border)]">
          {SECURITY_TOGGLES.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{s.label}</p>
                <p className="text-xs text-[var(--text-faint)] mt-0.5">{s.desc}</p>
              </div>
              <Switch checked={securityState[s.key]} onChange={() => toggleSecurity(s.key)} />
            </div>
          ))}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Session Timeout</p>
              <p className="text-xs text-[var(--text-faint)] mt-0.5">Auto-logout after inactivity period</p>
            </div>
            <Select
              value={sessionTimeout}
              onChange={setSessionTimeout}
              className="!w-36"
              options={["30 minutes", "1 hour", "2 hours", "4 hours"].map((o) => ({ value: o, label: o }))}
            />
          </div>
        </div>
      </Card>
      <div className="flex justify-end">
        <Button type="primary">Save Settings</Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-5">
        <Typography.Title level={4} className="!mb-0.5 !text-[var(--text)]">
          Settings
        </Typography.Title>
        <p className="text-sm text-[var(--text-faint)]">Configure portal appearance, notifications, and security</p>
      </div>

      <Tabs
        defaultActiveKey="general"
        items={[
          { key: "general", label: "General", children: generalTab },
          { key: "notifications", label: "Notifications", children: notificationsTab },
          { key: "security", label: "Security", children: securityTab },
        ]}
      />
    </div>
  );
}
