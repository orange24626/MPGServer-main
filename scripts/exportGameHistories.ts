import moment from "moment";
import { ExportFileService } from "../src/services/";
await ExportFileService.exportGameHistory({
  player: {
    operatorAccountID: {
      startsWith: "lam516%",
    },
  },
  createdAt: {
    lte: moment().startOf("day").toDate(),
  },
});
process.exit(0);
