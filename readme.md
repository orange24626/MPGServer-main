To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

open http://localhost:3000
or
open https://localhost:3001

### 调试前端：

1. 增加本地域名，在您开发机器的hosts里

```
127.0.0.1       mpg.local
127.0.0.1       api.mpg.local
```

2. 浏览器访问 https://mpg.local 允许运行不安全的ssl证书

3. 浏览器访问 https://api.mpg.local 允许运行不安全的ssl证书

4. 消除google chrome 安全性 chrome://flags/#unsafely-treat-insecure-origin-as-secure

![如图](https://statics.wolove.life/unsafe.jpg)

5. 访问此链接

https://mpg.local:3001/126/index.html?btt=1&oc=0&iwk=1&ot=8d5a5b047fee3a539d0af45788f49257&ops=522648ad480a46609a83cf3b47371707&l=pt&op=316901&or=mpg.local:3001&__refer=mpg.local:3001&__hv=1f8654d9

6. 在浏览器内取消debug模式

![此处为取消的地方](https://statics.wolove.life/debug0cancel.jpg)

### 部署
