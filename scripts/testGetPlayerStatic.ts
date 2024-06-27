import { GameHistoryService } from "../src/services/GameHistoryService";

const statics = await GameHistoryService.getPlayerStatics({
  filter: {
    operatorAccountID: "1762256779621",
  },
  offset: 0,
  limit: 100,
  sort: {
    field: "createdAt",
    order: "asc",
  },
});

console.log(JSON.stringify(statics, null, 2));

process.exit(0);
