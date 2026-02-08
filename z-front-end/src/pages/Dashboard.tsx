import { Typography } from "antd";
import HelloWorld from "../components/HelloWorld";

const { Title } = Typography;

export default function Dashboard() {
  return (
    <>
      <Title level={3}>Dashboard</Title>
      <HelloWorld />
    </>
  );
}
