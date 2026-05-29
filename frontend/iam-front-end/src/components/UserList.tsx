import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUrlState } from "../hooks/state";
import { Button, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { User } from "../api/types";
import { useUsers } from "../hooks/useUsers";
import AddUserModal from "./AddUserModal";

const columns: ColumnsType<User> = [
  { title: "Name",       dataIndex: "name"       },
  { title: "Email",      dataIndex: "email"      },
  { title: "Title",      dataIndex: "title"      },
  { title: "Department", dataIndex: "department" },
];

export default function UserList() {
  const [page]              = useUrlState("page", 1);
  const [pageSize]          = useUrlState("size", 10);
  const [, setSearchParams] = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading, refetch } = useUsers(page - 1, pageSize);

  const users = data?.content       ?? [];
  const total = data?.totalElements ?? 0;

  return (
    <>
      <div className="mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
          Register User
        </Button>
      </div>

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
              if (p  === 1)  params.delete("page"); else params.set("page", JSON.stringify(p));
              if (ps === 10) params.delete("size"); else params.set("size", JSON.stringify(ps));
              return params;
            }, { replace: true });
          },
        }}
      />

      <AddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => { setAddOpen(false); void refetch(); }}
      />
    </>
  );
}
