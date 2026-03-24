import { useEffect, useState } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { fetchUsers } from "../../api/ticketApi";
import type { User } from "../../api/types";

const columns: ColumnsType<User> = [
  { title: "Name", dataIndex: "name" },
  { title: "Email", dataIndex: "email" },
  { title: "Title", dataIndex: "title" },
  { title: "Department", dataIndex: "department" },
];

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers(page - 1, pageSize)
      .then((res) => { setUsers(res.content); setTotal(res.totalElements); })
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  return (
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
  );
}
