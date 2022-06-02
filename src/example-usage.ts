import { intermingledChannels } from "./async-channel";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

(async () => {
  const [controller1, controller2] = intermingledChannels<
    number,
    { done: true } | number
  >();
  const result = (async () => {
    let num = 0;
    const { send, receive } = controller1;
    return Promise.allSettled([
      (async () => {
        while (true) {
          await sleep(1000);
          await send(++num);
        }
      })(),
      (async () => {
        while (true) {
          const value = await receive();
          if (!!value && typeof value !== "number" && "done" in value) return;
          num = value ?? 0;
          send(num);
        }
      })()
    ]);
  })();

  console.clear();
  for await (const item of controller2) {
    if (!item) return;
    if (item === 10) {
      controller2.send(100);
    } else if (item > 110) {
      break;
    }
    console.log(item);
  }

  console.log("FOOO");

  console.log(await result);
})();
