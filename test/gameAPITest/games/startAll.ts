import { nanoid } from "nanoid";

const OPERATOR_API_BASE_URL = "http://localhost:3000";
const ORDER_API_BASE_URL = "http://localhost:3000";
const GAME_API_BASE_URL = "http://localhost:3000";

try {
  //
  if (!process.send) {
    console.error("Not running in a child process");
    process.exit(1);
  }
  process.send(`启动游戏中", "Respond to parent", ${process.pid}${new Date().getTime()}`);

  process.on("message", (message) => {
    console.log("message from parent", message);
  });

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
