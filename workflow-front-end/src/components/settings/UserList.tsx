import { useUrlState } from "@state";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { User } from "../../api/types";
import { useUsers } from "../../hooks/useUsers";

const columns: ColumnsType<User> = [
  { title: "Name",       dataIndex: "name"       },
  { title: "Email",      dataIndex: "email"      },
  { title: "Title",      dataIndex: "title"      },
  { title: "Department", dataIndex: "department" },
];

export default function UserList() {
  const [page,     setPage]     = useUrlState("page", 1);
  const [pageSize, setPageSize] = useUrlState("size", 10);

  const { data, isLoading } = useUsers(page - 1, pageSize);

  const users = data?.content       ?? [];
  const total = data?.totalElements ?? 0;

  return (
    <Table
      rowKey="sub"
      columns={columns}
      dataSource={users}
      loading={isLoading}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        onChange: (p, ps) => { setPage(p); setPageSize(ps); },
      }}
    />
  );
}
