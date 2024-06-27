import { customAlphabet } from "nanoid";

const alphabet = "1234567890";

export function historyIDGenerate(playerId: number) {
  //总长度18位
  const playerIdStr = playerId.toString();
  const playerIdStrLength = playerIdStr.length;
  const time = new Date().getTime().toString();
  const timeStrLength = time.length;
  const playerIdStrFull = "0".repeat(timeStrLength - playerIdStrLength) + playerIdStr;
  let result = "";
  for (let index = 0; index < timeStrLength; index++) {
    result += (Number(playerIdStrFull[index]) + Number(time[timeStrLength - index - 1])) % 10;
  }
  const nanoid = customAlphabet(alphabet, 18 - timeStrLength);
  result += nanoid();
  return result;
}
