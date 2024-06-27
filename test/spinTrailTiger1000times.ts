import { nanoid } from "nanoid";
import bun from "bun";

const OPERATOR_API_BASE_URL = "http://localhost:3000";
const ORDER_API_BASE_URL = "http://localhost:3000";
const GAME_API_BASE_URL = "http://localhost:3000";

try {
  //
  console.log("hello world!");
  if (!process.send) {
    console.error("Not running in a child process");
    process.exit(1);
  }
  process.send(`开始运行子进程", "Respond to parent", ${process.pid}${new Date().getTime()}`);

  // const operators = await fetch(`${OPERATOR_API_BASE_URL}/admin/operators/`);

  const user = {
    userId: nanoid(),
    username: "test_" + nanoid(),
  };
  console.log("user", user);
} catch (error) {
  console.log("error", error);
}

//调用
