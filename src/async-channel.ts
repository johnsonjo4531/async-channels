type Awaited<T> = T extends null | undefined
  ? T
  : T extends object & {
      then(onfulfilled: infer F): any;
    }
  ? F extends (value: infer V, ...args: any) => any
    ? Awaited<V>
    : never
  : T;
type ChannelReaderType<T> =
  | ReadableStreamDefaultReader<T>
  | AsyncChannelController<unknown, T, unknown>;
type AsyncChannelController<Send, Receive, ExternalReceive> = {
  receive: () => Promise<ExternalReceive | undefined>;
  receiveAll: () => AsyncGenerator<
    Awaited<ExternalReceive> | undefined,
    void,
    any
  >;
  return: () => Promise<void>;
  throw: (err: any) => Promise<never>;
  send: (output: Send) => Promise<void>;
  assignReader: (reader: ChannelReaderType<ExternalReceive>) => void;
  reader: ReadableStreamDefaultReader<Receive>;
  [Symbol.asyncIterator]: AsyncChannelController<
    Send,
    Receive,
    ExternalReceive
  >["receiveAll"];
};

async function* consumeStream<T>(
  stream: ReadableStreamDefaultReader<T>,
  onExit: {
    throw: (err?: any) => Promise<never> | never;
    return: () => Promise<void> | void;
  }
) {
  try {
    let done, value;
    do {
      ({ done, value } = await stream.read());
      if (done) continue;
      yield value;
    } while (!done);
  } catch (err) {
    return onExit.throw(err);
  } finally {
    return onExit.return();
  }
}

function getReader<T>(
  reader:
    | ReadableStreamDefaultReader<T>
    | AsyncChannelController<unknown, T, unknown>
) {
  if (reader instanceof ReadableStreamDefaultReader) {
    return reader;
  } else if ("reader" in reader) {
    return reader.reader;
  }
}

/** */
function AsyncChannel<
  ChannelInternalSend,
  ChannelInternalReceive,
  ChannelExternalReceive
>(
  reader?: ChannelReaderType<ChannelExternalReceive>
): AsyncChannelController<
  ChannelInternalSend,
  ChannelInternalReceive,
  ChannelExternalReceive
> {
  let _reader: ReadableStreamDefaultReader<ChannelExternalReceive> | undefined =
    typeof reader === "undefined" ? undefined : getReader(reader);
  // type InternalReceive = ExternalSend;
  const internalStream = new TransformStream<
    ChannelInternalSend,
    ChannelInternalReceive
  >();
  const [internalReader, writer] = [
    internalStream.readable.getReader(),
    internalStream.writable.getWriter(),
  ];

  async function cleanup() {
    await Promise.allSettled([
      internalStream.writable.close(),
      internalStream.readable.cancel(),
    ]);
  }

  return {
    async receive() {
      if (!_reader)
        throw new Error(
          "No reader available you must either pass in a reader at initialization or assign one later."
        );
      return (await _reader.read())?.value;
    },
    receiveAll: async function* receiveAll() {
      if (!_reader)
        throw new Error(
          "No reader available you must either pass in a reader at initialization or assign one later."
        );
      yield* consumeStream<ChannelExternalReceive>(_reader, this);
    },
    async return() {
      await cleanup();
    },
    async throw(err: any) {
      await cleanup();
      throw err;
    },
    async send(data) {
      return writer.write(data);
    },
    assignReader(newExternalReader) {
      _reader = getReader(newExternalReader);
    },
    reader: internalReader,
    [Symbol.asyncIterator]() {
      return this.receiveAll();
    },
  } as const;
}

export function intermingledChannels<Channel1Send, Channel2Send>() {
  type Channel2Receive = Channel1Send;
  type Channel1Receive = Channel2Send;
  const controller1 = AsyncChannel<
    Channel1Send,
    Channel1Send,
    Channel1Receive
  >();
  const controller2 = AsyncChannel<Channel2Send, Channel2Send, Channel2Receive>(
    controller1.reader
  );
  controller1.assignReader(controller2.reader);
  return [controller1, controller2] as const;
}
