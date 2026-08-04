import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Table, Space, Modal, Form, Input, Select, Popconfirm, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from "@ant-design/icons";
import InitialsAvatar from "../../components/admin/InitialsAvatar";
import {
  fetchDepartments,
  fetchUnits,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createUnit,
  updateUnit,
  deleteUnit,
  type Department,
  type Unit,
  type DepartmentInput,
  type UnitInput,
} from "../../api/orgApi";
import { fetchEmployees } from "../../api/employeesApi";

interface Row {
  key: string;
  type: "department" | "unit";
  id: number;
  name: string;
  head: string | null;
  location: string | null;
  departmentId?: number;
  headcount: number;
  children?: Row[];
}

export default function OrgStructure() {
  const queryClient = useQueryClient();
  const [deptModal, setDeptModal] = useState<{ mode: "add" | "edit"; dept?: Department } | null>(
    null,
  );
  const [unitModal, setUnitModal] = useState<{
    mode: "add" | "edit";
    unit?: Unit;
    departmentId?: number;
  } | null>(null);
  const [deptForm] = Form.useForm<DepartmentInput>();
  const [unitForm] = Form.useForm<UnitInput>();

  const { data: departments = [], isLoading: deptsLoading } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: fetchDepartments,
  });
  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ["admin", "units"],
    queryFn: () => fetchUnits(),
  });
  const { data: employeePage } = useQuery({
    queryKey: ["admin", "employees", "all"],
    queryFn: () => fetchEmployees({ page: 0, size: 500 }),
  });
  const employees = employeePage?.content ?? [];

  const subToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of employees) map.set(e.sub, e.name);
    return map;
  }, [employees]);

  const headcountByDept = useMemo(() => {
    const map = new Map<number, number>();
    for (const e of employees) {
      if (e.departmentId != null) map.set(e.departmentId, (map.get(e.departmentId) ?? 0) + 1);
    }
    return map;
  }, [employees]);

  const headcountByUnit = useMemo(() => {
    const map = new Map<number, number>();
    for (const e of employees) {
      if (e.unitId != null) map.set(e.unitId, (map.get(e.unitId) ?? 0) + 1);
    }
    return map;
  }, [employees]);

  const rows: Row[] = useMemo(
    () =>
      departments.map((d) => ({
        key: `d-${d.id}`,
        type: "department",
        id: d.id,
        name: d.name,
        head: d.head,
        location: d.location,
        headcount: headcountByDept.get(d.id) ?? 0,
        children: units
          .filter((u) => u.departmentId === d.id)
          .map((u) => ({
            key: `u-${u.id}`,
            type: "unit",
            id: u.id,
            name: u.name,
            head: u.head,
            location: u.location,
            departmentId: u.departmentId,
            headcount: headcountByUnit.get(u.id) ?? 0,
          })),
      })),
    [departments, units, headcountByDept, headcountByUnit],
  );

  const totalEmployees = employees.length;

  const upsertInList = <T extends { id: number }>(list: T[] | undefined, item: T): T[] => {
    const arr = list ?? [];
    const idx = arr.findIndex((x) => x.id === item.id);
    if (idx === -1) return [...arr, item];
    const copy = arr.slice();
    copy[idx] = item;
    return copy;
  };

  // Writes land on auth-service; the employee-service mirror this page reads from only catches
  // up once the Kafka event lands, so push the saved row into the cache directly instead of
  // waiting on a refetch.
  const deptMutation = useMutation({
    mutationFn: (input: { mode: "add" | "edit"; id?: number; payload: DepartmentInput }) =>
      input.mode === "add"
        ? createDepartment(input.payload)
        : updateDepartment(input.id!, input.payload),
    onSuccess: (saved) => {
      queryClient.setQueryData<Department[]>(["admin", "departments"], (old) =>
        upsertInList(old, saved),
      );
      message.success("Department saved");
      setDeptModal(null);
    },
    onError: () => message.error("Failed to save department"),
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Department[]>(["admin", "departments"], (old) =>
        (old ?? []).filter((d) => d.id !== id),
      );
      message.success("Department deleted");
    },
    onError: () => message.error("Failed to delete department — it may still have units or employees"),
  });

  const unitMutation = useMutation({
    mutationFn: (input: { mode: "add" | "edit"; id?: number; payload: UnitInput }) =>
      input.mode === "add" ? createUnit(input.payload) : updateUnit(input.id!, input.payload),
    onSuccess: (saved) => {
      queryClient.setQueryData<Unit[]>(["admin", "units"], (old) => upsertInList(old, saved));
      message.success("Unit saved");
      setUnitModal(null);
    },
    onError: () => message.error("Failed to save unit"),
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (id: number) => deleteUnit(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Unit[]>(["admin", "units"], (old) =>
        (old ?? []).filter((u) => u.id !== id),
      );
      message.success("Unit deleted");
    },
    onError: () => message.error("Failed to delete unit"),
  });

  const openAddDepartment = () => {
    deptForm.resetFields();
    setDeptModal({ mode: "add" });
  };
  const openEditDepartment = (d: Department) => {
    deptForm.setFieldsValue({ name: d.name, head: d.head ?? undefined, location: d.location ?? undefined });
    setDeptModal({ mode: "edit", dept: d });
  };
  const openAddUnit = (departmentId: number) => {
    unitForm.resetFields();
    unitForm.setFieldValue("departmentId", departmentId);
    setUnitModal({ mode: "add", departmentId });
  };
  const openEditUnit = (u: Unit) => {
    unitForm.setFieldsValue({
      name: u.name,
      departmentId: u.departmentId,
      head: u.head ?? undefined,
      location: u.location ?? undefined,
    });
    setUnitModal({ mode: "edit", unit: u, departmentId: u.departmentId });
  };

  const columns: ColumnsType<Row> = [
    {
      title: "Department / Unit",
      dataIndex: "name",
      render: (name: string, row) => (
        <div className="flex items-center gap-2">
          <ApartmentOutlined
            className={row.type === "department" ? "text-[var(--accent)]" : "text-[var(--text-faint)]"}
          />
          <span className={row.type === "department" ? "font-medium text-[var(--text)]" : "text-[var(--text-dim)]"}>
            {name}
          </span>
        </div>
      ),
    },
    {
      title: "Head",
      dataIndex: "head",
      render: (head: string | null) =>
        head ? (
          <div className="flex items-center gap-2">
            <InitialsAvatar name={subToName.get(head) ?? head} size={22} />
            <span className="text-[var(--text-dim)] text-xs">{subToName.get(head) ?? head}</span>
          </div>
        ) : (
          <span className="text-xs text-[var(--text-faint)]">—</span>
        ),
    },
    {
      title: "Headcount",
      dataIndex: "headcount",
      render: (count: number) => <span className="font-semibold text-[var(--text)]">{count}</span>,
    },
    {
      title: "Location",
      dataIndex: "location",
      render: (loc: string | null) =>
        loc ? (
          <span className="px-2 py-0.5 bg-[var(--hover)] text-[var(--text-dim)] rounded text-xs">{loc}</span>
        ) : (
          <span className="text-xs text-[var(--text-faint)]">—</span>
        ),
    },
    {
      title: "",
      key: "actions",
      width: 140,
      render: (_, row) => (
        <Space size={2}>
          {row.type === "department" && (
            <Button type="text" size="small" onClick={() => openAddUnit(row.id)}>
              + Unit
            </Button>
          )}
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() =>
              row.type === "department"
                ? openEditDepartment(departments.find((d) => d.id === row.id)!)
                : openEditUnit(units.find((u) => u.id === row.id)!)
            }
          />
          <Popconfirm
            title={row.type === "department" ? "Delete this department?" : "Delete this unit?"}
            onConfirm={() =>
              row.type === "department"
                ? deleteDeptMutation.mutate(row.id)
                : deleteUnitMutation.mutate(row.id)
            }
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Org Structure</h1>
          <p className="text-xs text-[var(--text-faint)] mt-0.5">
            {departments.length} departments · {units.length} units · {totalEmployees} employees
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDepartment}>
          Add Department
        </Button>
      </div>

      <Table<Row>
        columns={columns}
        dataSource={rows}
        rowKey="key"
        size="middle"
        loading={deptsLoading || unitsLoading}
        pagination={false}
      />

      <Modal
        title={deptModal?.mode === "edit" ? "Edit Department" : "Add Department"}
        open={!!deptModal}
        onCancel={() => setDeptModal(null)}
        onOk={() => deptForm.submit()}
        okText={deptModal?.mode === "edit" ? "Save" : "Add Department"}
        confirmLoading={deptMutation.isPending}
      >
        <Form
          form={deptForm}
          layout="vertical"
          className="mt-4"
          onFinish={(values) =>
            deptMutation.mutate({ mode: deptModal!.mode, id: deptModal?.dept?.id, payload: values })
          }
        >
          <Form.Item label="Department Name" name="name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="e.g. Production Line F" />
          </Form.Item>
          <Form.Item label="Department Head" name="head">
            <Select
              allowClear
              showSearch
              placeholder="Select employee..."
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={employees.map((e) => ({ value: e.sub, label: e.name }))}
            />
          </Form.Item>
          <Form.Item label="Location" name="location">
            <Input placeholder="e.g. Factory 1, HQ" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={unitModal?.mode === "edit" ? "Edit Unit" : "Add Unit"}
        open={!!unitModal}
        onCancel={() => setUnitModal(null)}
        onOk={() => unitForm.submit()}
        okText={unitModal?.mode === "edit" ? "Save" : "Add Unit"}
        confirmLoading={unitMutation.isPending}
      >
        <Form
          form={unitForm}
          layout="vertical"
          className="mt-4"
          onFinish={(values) =>
            unitMutation.mutate({ mode: unitModal!.mode, id: unitModal?.unit?.id, payload: values })
          }
        >
          <Form.Item label="Department" name="departmentId" rules={[{ required: true }]}>
            <Select options={departments.map((d) => ({ value: d.id, label: d.name }))} />
          </Form.Item>
          <Form.Item label="Unit Name" name="name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="e.g. Line A" />
          </Form.Item>
          <Form.Item label="Unit Head" name="head">
            <Select
              allowClear
              showSearch
              placeholder="Select employee..."
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={employees.map((e) => ({ value: e.sub, label: e.name }))}
            />
          </Form.Item>
          <Form.Item label="Location" name="location">
            <Input placeholder="e.g. Factory 1" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
