import { useState } from "react";
import { Button, Table, Space, Progress, Modal, Form, Input, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, CloseOutlined, ApartmentOutlined } from "@ant-design/icons";
import InitialsAvatar from "../../components/admin/InitialsAvatar";
import { departments, employees } from "../../data/admin/mockData";

type Department = (typeof departments)[number];

export default function OrgStructure() {
  const [showAdd, setShowAdd] = useState(false);
  const [form] = Form.useForm();
  const total = departments.reduce((a, d) => a + d.count, 0);

  const handleAdd = () => {
    form.resetFields();
    setShowAdd(false);
  };

  const columns: ColumnsType<Department> = [
    {
      title: "Department",
      dataIndex: "name",
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <ApartmentOutlined className="text-[var(--accent)] flex-shrink-0" />
          <span className="font-medium text-[var(--text)]">{name}</span>
        </div>
      ),
    },
    {
      title: "Department Head",
      dataIndex: "head",
      render: (head: string) => (
        <div className="flex items-center gap-2">
          <InitialsAvatar name={head} size={24} />
          <span className="text-[var(--text-dim)]">{head}</span>
        </div>
      ),
    },
    {
      title: "Headcount",
      dataIndex: "count",
      render: (count: number) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={Math.min(100, (count / 150) * 100)}
            showInfo={false}
            size="small"
            strokeColor="var(--accent)"
            className="!w-16"
          />
          <span className="font-semibold text-[var(--text)]">{count}</span>
        </div>
      ),
    },
    {
      title: "Factory / Location",
      dataIndex: "factory",
      render: (factory: string) => (
        <span className="px-2 py-0.5 bg-[var(--hover)] text-[var(--text-dim)] rounded text-xs">{factory}</span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 90,
      render: () => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Button type="text" size="small" danger icon={<CloseOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Org Structure</h1>
          <p className="text-xs text-[var(--text-faint)] mt-0.5">{departments.length} departments · {total} employees</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>
          Add Department
        </Button>
      </div>

      <Table<Department>
        columns={columns}
        dataSource={departments}
        rowKey="id"
        size="middle"
        pagination={false}
        footer={() => (
          <span className="text-xs text-[var(--text-faint)]">
            {departments.length} departments · {total} employees mapped
          </span>
        )}
      />

      <Modal
        title="Add Department"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={handleAdd}
        okText="Add Department"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="Department Name" name="name">
            <Input placeholder="e.g. Production Line F" />
          </Form.Item>
          <Form.Item label="Department Head" name="head">
            <Select
              placeholder="Select employee..."
              options={employees.filter((e) => e.role !== "Employee").map((e) => ({ value: e.name, label: e.name }))}
            />
          </Form.Item>
          <Form.Item label="Factory / Location" name="factory">
            <Select
              options={[
                { value: "HQ", label: "HQ" },
                { value: "Factory 1", label: "Factory 1" },
                { value: "Factory 2", label: "Factory 2" },
                { value: "Warehouse", label: "Warehouse" },
                { value: "Both", label: "Both" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
