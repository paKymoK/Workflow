import type { MessageInstance } from "antd/es/message/interface";

let instance: MessageInstance | null = null;

export function setMessageInstance(msg: MessageInstance) {
  instance = msg;
}

export function getMessageInstance(): MessageInstance | null {
  return instance;
}
