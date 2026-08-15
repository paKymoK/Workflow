import { useState } from "react";
import { Typography, Button, Table, Progress, Modal, Input, Select, DatePicker, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, BarChartOutlined, EditOutlined, CloseOutlined } from "@ant-design/icons";
import StatusTag from "../../components/admin/StatusTag";
import { surveysData } from "../../data/admin/mockData";

const { Title, Text } = Typography;

type Survey = (typeof surveysData)[number];

const DEFAULT_QUESTIONS = [
  "How satisfied are you with your current working conditions?",
  "How would you rate the canteen food quality?",
];

export default function Surveys() {
  const [showCreate, setShowCreate] = useState(false);
  const [questions, setQuestions] = useState<string[]>(DEFAULT_QUESTIONS);

  const removeQuestion = (i: number) => setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  const addQuestion = () => setQuestions((prev) => [...prev, "New question..."]);

  const closeModal = () => {
    setShowCreate(false);
    setQuestions(DEFAULT_QUESTIONS);
  };

  const columns: ColumnsType<Survey> = [
    { title: "Survey Title", dataIndex: "title", render: (v: string) => <span className="font-medium text-[var(--text)]">{v}</span> },
    { title: "Created", dataIndex: "created", render: (v: string) => <span className="text-xs text-[var(--text-faint)]">{v}</span> },
    { title: "Closes", dataIndex: "closes", render: (v: string) => <span className="text-xs text-[var(--text-faint)]">{v}</span> },
    {
      title: "Responses",
      key: "responses",
      render: (_, record) => (
        <span>
          <span className="font-semibold text-[var(--text)]">{record.responses.toLocaleString()}</span>
          <span className="text-[var(--text-faint)] text-xs"> / {record.total.toLocaleString()}</span>
        </span>
      ),
    },
    {
      title: "Completion",
      key: "completion",
      width: 160,
      render: (_, record) => {
        const pct = Math.round((record.responses / record.total) * 100);
        return <Progress percent={pct} size="small" strokeColor="var(--accent)" />;
      },
    },
    { title: "Status", dataIndex: "status", render: (v: string) => <StatusTag status={v} /> },
    {
      title: "",
      key: "actions",
      render: () => (
        <div className="flex items-center gap-0.5">
          <Button type="text" size="small" icon={<BarChartOutlined />} />
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Popconfirm title="Delete this survey?" okText="Delete" cancelText="Cancel">
            <Button type="text" size="small" danger icon={<CloseOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <Title level={4} className="!mb-0.5">
            Survey Management
          </Title>
          <Text className="text-xs text-[var(--text-faint)]">Create and manage employee surveys</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
          Create Survey
        </Button>
      </div>

      <Table<Survey>
        columns={columns}
        dataSource={surveysData}
        rowKey="id"
        size="middle"
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} surveys` }}
      />

      <Modal
        open={showCreate}
        onCancel={closeModal}
        title="Create Survey"
        width={600}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            Cancel
          </Button>,
          <Button key="create" type="primary" onClick={closeModal}>
            Create Survey
          </Button>,
        ]}
      >
        <div className="flex flex-col gap-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-[var(--text-dim)] mb-1.5">Survey Title</label>
            <Input placeholder="Survey name..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-dim)] mb-1.5">Target Group</label>
              <Select
                className="w-full"
                defaultValue="All Employees"
                options={[
                  { value: "All Employees", label: "All Employees" },
                  { value: "Production Only", label: "Production Only" },
                  { value: "Managers Only", label: "Managers Only" },
                  { value: "HQ Staff", label: "HQ Staff" },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-dim)] mb-1.5">Close Date</label>
              <DatePicker className="w-full" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--text-dim)]">Questions</label>
              <Button type="text" size="small" icon={<PlusOutlined />} onClick={addQuestion}>
                Add Question
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                  <span className="text-xs font-mono text-[var(--text-faint)] mt-0.5">Q{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--text)] m-0">{q}</p>
                    <p className="text-xs text-[var(--text-faint)] mt-0.5 mb-0">Rating Scale (1–5)</p>
                  </div>
                  <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => removeQuestion(i)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
