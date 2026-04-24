import { useState } from "react";
import {
  Button, Drawer, Form, Input, InputNumber, Popconfirm,
  Select, Space, Switch, Table, Tag, Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { RegisteredClient, RegisteredClientRequest } from "../../api/types";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "../../hooks/useClients";

const { Text } = Typography;

const AUTH_METHOD_OPTIONS = [
  { label: "None (public / PKCE)",     value: "none"                },
  { label: "Client Secret Basic",      value: "client_secret_basic" },
  { label: "Client Secret Post",       value: "client_secret_post"  },
  { label: "Client Secret JWT",        value: "client_secret_jwt"   },
  { label: "Private Key JWT",          value: "private_key_jwt"     },
];

const GRANT_TYPE_OPTIONS = [
  { label: "Authorization Code", value: "authorization_code"  },
  { label: "Refresh Token",      value: "refresh_token"       },
  { label: "Client Credentials", value: "client_credentials"  },
];

const SCOPE_OPTIONS = [
  { label: "openid",          value: "openid"          },
  { label: "profile",         value: "profile"         },
  { label: "offline_access",  value: "offline_access"  },
];

const DEFAULT_VALUES: Partial<RegisteredClientRequest> = {
  authenticationMethods: ["none"],
  grantTypes: ["authorization_code", "refresh_token"],
  redirectUris: [],
  postLogoutRedirectUris: [],
  scopes: ["openid", "profile", "offline_access"],
  requireAuthorizationConsent: false,
  requireProofKey: true,
  accessTokenTtlMinutes: 10,
  refreshTokenTtlDays: 1,
  reuseRefreshTokens: false,
};

/** Controlled tag-list input for URIs */
function UriListInput({
  value = [],
  onChange,
}: {
  value?: string[];
  onChange?: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange?.([...value, trimmed]);
    setInput("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={add}
          placeholder="https://example.com/callback"
          className="flex-1"
        />
        <Button onClick={add}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {value.map((uri) => (
          <Tag
            key={uri}
            closable
            onClose={() => onChange?.(value.filter((u) => u !== uri))}
            className="font-mono text-xs"
          >
            {uri}
          </Tag>
        ))}
      </div>
    </div>
  );
}

export default function ClientList() {
  const { data = [], isLoading } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<RegisteredClient | null>(null);
  const [form] = Form.useForm<RegisteredClientRequest>();

  const watchedMethods: string[] = Form.useWatch("authenticationMethods", form) ?? [];
  const isPublic = watchedMethods.every((m) => m === "none");

  const onAdd = () => {
    setEditing(null);
    form.setFieldsValue(DEFAULT_VALUES as RegisteredClientRequest);
    setOpen(true);
  };

  const onEdit = (record: RegisteredClient) => {
    setEditing(record);
    form.setFieldsValue({
      clientId:                  record.clientId,
      clientSecret:              undefined,
      authenticationMethods:     record.authenticationMethods,
      grantTypes:                record.grantTypes,
      redirectUris:              record.redirectUris,
      postLogoutRedirectUris:    record.postLogoutRedirectUris,
      scopes:                    record.scopes,
      requireAuthorizationConsent: record.requireAuthorizationConsent,
      requireProofKey:           record.requireProofKey,
      accessTokenTtlMinutes:     record.accessTokenTtlMinutes,
      refreshTokenTtlDays:       record.refreshTokenTtlDays,
      reuseRefreshTokens:        record.reuseRefreshTokens,
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setOpen(false);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<RegisteredClient> = [
    {
      title: "Client ID",
      dataIndex: "clientId",
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: "Auth Methods",
      dataIndex: "authenticationMethods",
      render: (methods: string[]) => (
        <div className="flex flex-wrap gap-1">
          {methods.map((m) => <Tag key={m}>{m}</Tag>)}
        </div>
      ),
    },
    {
      title: "Grant Types",
      dataIndex: "grantTypes",
      render: (types: string[]) => (
        <div className="flex flex-wrap gap-1">
          {types.map((t) => <Tag key={t} color="blue">{t}</Tag>)}
        </div>
      ),
    },
    {
      title: "Scopes",
      dataIndex: "scopes",
      render: (scopes: string[]) => (
        <div className="flex flex-wrap gap-1">
          {scopes.map((s) => <Tag key={s} color="green">{s}</Tag>)}
        </div>
      ),
    },
    {
      title: "Token TTL",
      width: 160,
      render: (_, r) => (
        <div className="text-xs leading-relaxed">
          <div>Access: {r.accessTokenTtlMinutes}m</div>
          <div>Refresh: {r.refreshTokenTtlDays}d</div>
        </div>
      ),
    },
    {
      title: "Flags",
      width: 140,
      render: (_, r) => (
        <div className="text-xs leading-relaxed">
          {r.requireProofKey           && <div>🔑 PKCE</div>}
          {r.requireAuthorizationConsent && <div>✅ Consent</div>}
          {r.hasSecret                 && <div>🔒 Secret</div>}
        </div>
      ),
    },
    {
      title: "Action",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
          <Popconfirm
            title="Delete this client?"
            description="All active sessions for this client will become invalid."
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Client
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={isLoading}
        pagination={false}
        scroll={{ x: true }}
      />

      <Drawer
        title={editing ? `Edit — ${editing.clientId}` : "New Registered Client"}
        open={open}
        onClose={() => setOpen(false)}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" loading={isSaving} onClick={onSubmit}>
              {editing ? "Save" : "Create"}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" requiredMark="optional">

          <Form.Item name="clientId" label="Client ID" rules={[{ required: true }]}>
            <Input placeholder="my-app" />
          </Form.Item>

          <Form.Item
            name="authenticationMethods"
            label="Authentication Methods"
            rules={[{ required: true }]}
          >
            <Select mode="multiple" options={AUTH_METHOD_OPTIONS} />
          </Form.Item>

          {!isPublic && (
            <Form.Item
              name="clientSecret"
              label={editing ? "Client Secret (leave blank to keep existing)" : "Client Secret"}
              rules={editing ? [] : [{ required: true }]}
            >
              <Input.Password placeholder={editing ? "••••••• (unchanged)" : "Enter secret"} />
            </Form.Item>
          )}

          <Form.Item
            name="grantTypes"
            label="Grant Types"
            rules={[{ required: true }]}
          >
            <Select mode="multiple" options={GRANT_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item name="scopes" label="Scopes" rules={[{ required: true }]}>
            <Select mode="tags" options={SCOPE_OPTIONS} placeholder="openid, profile …" />
          </Form.Item>

          <Form.Item name="redirectUris" label="Redirect URIs">
            <UriListInput />
          </Form.Item>

          <Form.Item name="postLogoutRedirectUris" label="Post-Logout Redirect URIs">
            <UriListInput />
          </Form.Item>

          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              name="accessTokenTtlMinutes"
              label="Access Token TTL (minutes)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
            <Form.Item
              name="refreshTokenTtlDays"
              label="Refresh Token TTL (days)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item name="requireProofKey" label="Require PKCE" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="requireAuthorizationConsent" label="Require Consent" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="reuseRefreshTokens" label="Reuse Refresh Tokens" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

        </Form>
      </Drawer>
    </>
  );
}
