import { useSearchParams } from "react-router-dom";
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
  const [page]                  = useUrlState("page", 1);
  const [pageSize]              = useUrlState("size", 10);
  const [, setSearchParams]     = useSearchParams();

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
        onChange: (p, ps) => {
          setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            p  === 1  ? params.delete("page") : params.set("page", JSON.stringify(p));
            ps === 10 ? params.delete("size") : params.set("size", JSON.stringify(ps));
            return params;
          }, { replace: true });
        },
      }}
    />
  );
}
