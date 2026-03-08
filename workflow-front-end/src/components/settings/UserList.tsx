import { useEffect, useState } from "react";
import { Table, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import { fetchUsers } from "../../api/ticketApi";
import type { User } from "../../api/types";
import AddUserModal from "./AddUserModal";

const columns: ColumnsType<User> = [
  { title: "Name", dataIndex: "name" },
  { title: "Email", dataIndex: "email" },
  { title: "Title", dataIndex: "title" },
  { title: "Department", dataIndex: "department" },
];

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers(page - 1, pageSize)
      .then((res) => { setUsers(res.content); setTotal(res.totalElements); })
      .finally(() => setLoading(false));
  }, [refreshKey, page, pageSize]);

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Add User
        </Button>
      </div>

      <Table
        rowKey="sub"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => { setLoading(true); setPage(p); setPageSize(ps); },
        }}
      />

      <AddUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); setLoading(true); setRefreshKey((k) => k + 1); }}
      />
    </>
  );
}
