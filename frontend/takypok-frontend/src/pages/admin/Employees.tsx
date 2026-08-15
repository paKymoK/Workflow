import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input, Select, Button, Table, Space, Modal, Form, DatePicker, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { SearchOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import InitialsAvatar from "../../components/admin/InitialsAvatar";
import AddUserModal from "../../components/settings/AddUserModal";
import {
  fetchEmployees,
  updateEmployee,
  updateEmployeeStatus,
  updateEmployeeManager,
  fetchEmployeePersonal,
  updateEmployeePersonal,
  type Employee,
  type EmploymentStatus,
  type Shift,
} from "../../api/employeesApi";
import { fetchDepartments, fetchUnits } from "../../api/orgApi";

const STATUS_OPTIONS: { value: EmploymentStatus; label: string; color: string }[] = [
  { value: "ACTIVE", label: "Active", color: "success" },
  { value: "ON_LEAVE", label: "On Leave", color: "warning" },
  { value: "SUSPENDED", label: "Suspended", color: "error" },
  { value: "TERMINATED", label: "Terminated", color: "default" },
];

const SHIFT_OPTIONS: { value: Shift; label: string }[] = [
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
  { value: "NIGHT", label: "Night" },
];

function statusTag(status: EmploymentStatus) {
  const cfg = STATUS_OPTIONS.find((s) => s.value === status);
  return <Tag color={cfg?.color ?? "default"}>{cfg?.label ?? status}</Tag>;
}

interface EditFormValues {
  title?: string;
  departmentId?: number;
  unitId?: number;
  workLocation?: string;
  joinedDate?: dayjs.Dayjs;
  shift?: Shift;
  shiftHours?: string;
  managerSub?: string;
  personalEmail?: string;
  mobilePhone?: string;
  dateOfBirth?: dayjs.Dayjs;
  gender?: string;
  nationalId?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export default function Employees() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | "all">("all");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [form] = Form.useForm<EditFormValues>();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: page, isLoading } = useQuery({
    queryKey: ["admin", "employees", debouncedSearch, deptFilter, statusFilter],
    queryFn: () =>
      fetchEmployees({
        q: debouncedSearch || undefined,
        departmentId: deptFilter === "all" ? undefined : deptFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: 0,
        size: 500,
      }),
  });
  const employees = page?.content ?? [];

  const { data: departments = [] } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: fetchDepartments,
  });
  const { data: units = [] } = useQuery({
    queryKey: ["admin", "units"],
    queryFn: () => fetchUnits(),
  });

  const { data: personal, isFetching: personalLoading } = useQuery({
    queryKey: ["admin", "employee-personal", editing?.sub],
    queryFn: () => fetchEmployeePersonal(editing!.sub),
    enabled: !!editing,
  });

  // Cheap, derived from the already-fetched page — not a real "manager" role, just a report count.
  const reportsBySub = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of employees) {
      if (e.managerSub) map.set(e.managerSub, (map.get(e.managerSub) ?? 0) + 1);
    }
    return map;
  }, [employees]);

  const invalidateEmployees = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });

  const statusMutation = useMutation({
    mutationFn: ({ sub, status }: { sub: string; status: EmploymentStatus }) =>
      updateEmployeeStatus(sub, status),
    onSuccess: () => {
      message.success("Status updated");
      invalidateEmployees();
    },
    onError: () => message.error("Failed to update status"),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: EditFormValues) => {
      const sub = editing!.sub;
      await updateEmployee(sub, {
        title: values.title || null,
        departmentId: values.departmentId ?? null,
        unitId: values.unitId ?? null,
        workLocation: values.workLocation || null,
        joinedDate: values.joinedDate ? values.joinedDate.format("YYYY-MM-DD") : null,
        shift: values.shift ?? null,
        shiftHours: values.shiftHours || null,
      });
      if ((values.managerSub ?? "") !== (editing!.managerSub ?? "")) {
        await updateEmployeeManager(sub, values.managerSub || null);
      }
      await updateEmployeePersonal(sub, {
        personalEmail: values.personalEmail || null,
        mobilePhone: values.mobilePhone || null,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format("YYYY-MM-DD") : null,
        gender: values.gender || null,
        nationalId: values.nationalId || null,
        address: values.address || null,
        emergencyContactName: values.emergencyContactName || null,
        emergencyContactPhone: values.emergencyContactPhone || null,
      });
    },
    onSuccess: () => {
      message.success("Employee updated");
      setEditing(null);
      invalidateEmployees();
    },
    onError: () => message.error("Failed to save changes"),
  });

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    form.setFieldsValue({
      title: employee.title ?? undefined,
      departmentId: employee.departmentId ?? undefined,
      unitId: employee.unitId ?? undefined,
      workLocation: employee.workLocation ?? undefined,
      joinedDate: employee.joinedDate ? dayjs(employee.joinedDate) : undefined,
      shift: employee.shift ?? undefined,
      shiftHours: employee.shiftHours ?? undefined,
      managerSub: employee.managerSub ?? undefined,
    });
  };

  // Personal data loads async (separate call) — patch it into the form once it arrives.
  useEffect(() => {
    if (editing && personal) {
      form.setFieldsValue({
        personalEmail: personal.personalEmail ?? undefined,
        mobilePhone: personal.mobilePhone ?? undefined,
        dateOfBirth: personal.dateOfBirth ? dayjs(personal.dateOfBirth) : undefined,
        gender: personal.gender ?? undefined,
        nationalId: personal.nationalId ?? undefined,
        address: personal.address ?? undefined,
        emergencyContactName: personal.emergencyContactName ?? undefined,
        emergencyContactPhone: personal.emergencyContactPhone ?? undefined,
      });
    }
  }, [editing, personal, form]);

  const unitsForDept = (departmentId?: number) =>
    units.filter((u) => u.departmentId === departmentId);

  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;

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
      title: "Employee ID",
      dataIndex: "sub",
      render: (sub: string) => (
        <span className="font-mono text-[11px] text-[var(--text-faint)]">{sub}</span>
      ),
    },
    {
      title: "Department / Unit",
      key: "dept",
      render: (_, e) => (
        <div className="text-xs">
          <div className="text-[var(--text-dim)]">{e.departmentName ?? "—"}</div>
          {e.unitName && <div className="text-[var(--text-faint)]">{e.unitName}</div>}
        </div>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      render: (title: string | null) => (
        <span className="text-[var(--text-faint)] text-xs">{title ?? "—"}</span>
      ),
    },
    {
      title: "Location",
      dataIndex: "workLocation",
      render: (loc: string | null) => <span className="text-xs text-[var(--text-dim)]">{loc ?? "—"}</span>,
    },
    {
      title: "Reports",
      key: "reports",
      render: (_, e) => {
        const count = reportsBySub.get(e.sub) ?? 0;
        return (
          <span className="text-xs text-[var(--text-dim)]">
            {count > 0 ? `${count} direct report${count > 1 ? "s" : ""}` : "—"}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: EmploymentStatus, e) => (
        <Select
          value={status}
          size="small"
          variant="borderless"
          className="!w-[112px]"
          options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: statusTag(s.value) }))}
          onChange={(value) => statusMutation.mutate({ sub: e.sub, status: value })}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_, e) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(e)} />
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddUser(true)}>
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
          value={deptFilter}
          onChange={setDeptFilter}
          className="!w-[220px]"
          options={[
            { value: "all", label: "All Departments" },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="!w-[160px]"
          options={[{ value: "all", label: "All Statuses" }, ...STATUS_OPTIONS]}
        />
      </div>

      <Table<Employee>
        columns={columns}
        dataSource={employees}
        rowKey="sub"
        size="middle"
        loading={isLoading}
        pagination={{ pageSize: 10, showTotal: () => `${employees.length} employees` }}
      />

      <AddUserModal
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSuccess={() => {
          setShowAddUser(false);
          message.info("Account registered. Once their profile shell appears below, edit it to fill in department, title, etc.");
          invalidateEmployees();
        }}
      />

      <Modal
        title={editing ? `Edit ${editing.name}` : "Edit Employee"}
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={() => form.submit()}
        okText="Save"
        confirmLoading={saveMutation.isPending}
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
          onFinish={(values) => saveMutation.mutate(values)}
        >
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="Title" name="title">
              <Input placeholder="Job title" />
            </Form.Item>
            <Form.Item label="Work Location" name="workLocation">
              <Input placeholder="e.g. Factory 1, HQ" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="Department" name="departmentId">
              <Select
                allowClear
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                onChange={() => form.setFieldValue("unitId", undefined)}
              />
            </Form.Item>
            <Form.Item shouldUpdate={(prev, next) => prev.departmentId !== next.departmentId} noStyle>
              {() => (
                <Form.Item label="Unit" name="unitId">
                  <Select
                    allowClear
                    options={unitsForDept(form.getFieldValue("departmentId")).map((u) => ({
                      value: u.id,
                      label: u.name,
                    }))}
                  />
                </Form.Item>
              )}
            </Form.Item>
          </div>
          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item label="Joined Date" name="joinedDate">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Shift" name="shift">
              <Select allowClear options={SHIFT_OPTIONS} />
            </Form.Item>
            <Form.Item label="Shift Hours" name="shiftHours">
              <Input placeholder="e.g. 06:00-14:00" />
            </Form.Item>
          </div>
          <Form.Item label="Manager" name="managerSub">
            <Select
              allowClear
              showSearch
              placeholder="Select manager..."
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={employees
                .filter((e) => e.sub !== editing?.sub)
                .map((e) => ({ value: e.sub, label: e.name }))}
            />
          </Form.Item>

          <div className="text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wide mt-2 mb-2">
            Personal {personalLoading && "(loading…)"}
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="Mobile Phone" name="mobilePhone">
              <Input placeholder="+84 ..." />
            </Form.Item>
            <Form.Item label="Personal Email" name="personalEmail">
              <Input type="email" placeholder="name@example.com" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="Date of Birth" name="dateOfBirth">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Gender" name="gender">
              <Select
                allowClear
                options={[
                  { value: "MALE", label: "Male" },
                  { value: "FEMALE", label: "Female" },
                  { value: "OTHER", label: "Other" },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item label="Address" name="address">
            <Input placeholder="Home address" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="Emergency Contact Name" name="emergencyContactName">
              <Input placeholder="Full name" />
            </Form.Item>
            <Form.Item label="Emergency Contact Phone" name="emergencyContactPhone">
              <Input placeholder="+84 ..." />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
