import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function HelloWorld() {
  return (
    <Card>
      <Title level={4}>Hello World</Title>
      <Paragraph>Welcome to Z App Dashboard!</Paragraph>
    </Card>
  );
}
