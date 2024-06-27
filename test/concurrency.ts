//并发数量
const concurrency = 100;
//启动并发请求
for (let i = 0; i < concurrency; i++) {
  const child = Bun.spawn(["bun", "./test/spinTrailTiger1000times.ts"], {
    ipc(message, childProc) {
      console.log("from sub", message);
      /**
       * The message received from the sub process
       **/
      childProc.send("Respond to child");
      const usage = child.resourceUsage();
    },
  });
}
