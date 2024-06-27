import chalk from "chalk";
import figlet from "figlet";
//并发数量

const concurrency = 100;
//启动并发请求
for (let i = 0; i < concurrency; i++) {
  const child = Bun.spawn(["bun", "./test/gameAPITest/games/startAll.ts"], {
    ipc(message, childProc) {
      console.log(
        chalk.green(
          figlet.textSync("Node JS CLI", {
            font: "Ghost",
            horizontalLayout: "default",
            verticalLayout: "default",
          }),
        ),
      );
      console.log(message);
      /**
       * The message received from the sub process
       **/
      childProc.send("开始启动老虎游戏");
    },
  });
}
