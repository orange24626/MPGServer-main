import { Hono } from "hono";

export const gameProxySocial = new Hono();

gameProxySocial.post("/SocialInitConfig/Get", (c) => {
  return c.json({
    dt: {
      countries: null,
      achievements: null,
      levelActionPermissions: null,
      gameChatEmoticonTemplateDatas: null,
      gameSpecificThresholdId: null,
      configurationSetting: null,
      onlinePlayerCounts: null,
      playerFavouriteGamesDatas: null,
      playerProfileInfo: null,
      levelBackground: null,
      onlinePlayerCount: null,
    },
    err: null,
  });
});
