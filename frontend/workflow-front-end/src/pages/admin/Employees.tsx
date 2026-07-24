import { useState } from "react";
import { Input, Select, Button, Table, Space, Modal, Form } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined, PlusOutlined, EyeOutlined, EditOutlined, CloseOutlined,
} from "@ant-design/icons";
import StatusTag from "../../components/admin/StatusTag";
import InitialsAvatar from "../../components/admin/InitialsAvatar";
import { employees, departments } from "../../data/admin/mockData";

type Employee = (typeof employees)[number];

export default function Employees() {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [deptF, setDeptF] = useState("All");
  const [roleF, setRoleF] = useState("All");
  const [form] = Form.useForm();

  const filtered = employees.filter((e) =>
    (deptF === "All" || e.dept === deptF) &&
    (roleF === "All" || e.role === roleF) &&
    (e.name.toLowerCase().includes(search.toLowerCase()) || e.dept.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = employees.filter((e) => e.status === "active").length;

  const handleAdd = () => {
    form.resetFields();
    setShowAdd(false);
  };

  const columns: ColumnsType<Employee> = [
    {
      title: "Name",
      dataIndex: "name",
      render: (name: string) => (
        <div className="flex items-center gap-2.5">
          <InitialsAvatar name={name} size={28} />
          <span className="font-medium text-[var(--text)] whitespace-nowrap">{name}</span>
        </div>
      ),
    },
    {
      title: "Department",
      dataIndex: "dept",
      render: (dept: string) => <span className="text-[var(--text-dim)] text-xs">{dept}</span>,
    },
    {
      title: "Position",
      dataIndex: "position",
      render: (position: string) => <span className="text-[var(--text-faint)] text-xs">{position}</span>,
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (role: string) => <StatusTag status={role} />,
    },
    {
      title: "Line / Factory",
      dataIndex: "line",
      render: (line: string) => <span className="text-xs text-[var(--text-dim)]">{line}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: "",
      key: "actions",
      width: 110,
      render: () => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EyeOutlined />} />
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
          <h1 className="text-xl font-bold text-[var(--text)]">Employee Directory</h1>
          <p className="text-xs text-[var(--text-faint)] mt-0.5">{activeCount} active employees</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>
          Add Employee
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Input
          prefix={<SearchOutlined className="text-[var(--text-faint)]" />}
          placeholder="Search by name or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          allowClear
        />
        <Select
          value={deptF}
          onChange={setDeptF}
          className="!w-[220px]"
          options={[{ value: "All", label: "All Departments" }, ...departments.map((d) => ({ value: d.name, label: d.name }))]}
        />
        <Select
          value={roleF}
          onChange={setRoleF}
          className="!w-[160px]"
          options={[
            { value: "All", label: "All Roles" },
            { value: "Employee", label: "Employee" },
            { value: "Manager", label: "Manager" },
            { value: "Admin", label: "Admin" },
          ]}
        />
      </div>

      <Table<Employee>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        size="middle"
        pagination={{ pageSize: 10, showTotal: () => `${filtered.length} of ${employees.length} employees` }}
      />

      <Modal
        title="Add Employee"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={handleAdd}
        okText="Add Employee"
        width={640}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="Full Name" name="name">
              <Input placeholder="Employee full name" />
            </Form.Item>
            <Form.Item label="Employee ID" name="employeeId">
              <Input placeholder="EMP-0000" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="Department" name="dept">
              <Select options={departments.map((d) => ({ value: d.name, label: d.name }))} />
            </Form.Item>
            <Form.Item label="Position" name="position">
              <Input placeholder="Job title" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="Role" name="role">
              <Select
                options={[
                  { value: "Employee", label: "Employee" },
                  { value: "Manager", label: "Manager" },
                  { value: "Admin", label: "Admin" },
                ]}
              />
            </Form.Item>
            <Form.Item label="Line / Factory" name="line">
              <Select
                options={[
                  { value: "HQ", label: "HQ" },
                  { value: "Factory 1", label: "Factory 1" },
                  { value: "Factory 2", label: "Factory 2" },
                  { value: "Warehouse", label: "Warehouse" },
                ]}
              />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="Email" name="email">
              <Input type="email" placeholder="name@cmcglobal.com" />
            </Form.Item>
            <Form.Item label="Phone" name="phone">
              <Input placeholder="+62 812 xxxx xxxx" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
