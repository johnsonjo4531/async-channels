type Awaited<T> = T extends null | undefined ? T : T extends object & {
    then(onfulfilled: infer F): any;
} ? F extends (value: infer V, ...args: any) => any ? Awaited<V> : never : T;
type ChannelReaderType<T> = ReadableStreamDefaultReader<T> | AsyncChannelController<unknown, T, unknown>;
type AsyncChannelController<Send, Receive, ExternalReceive> = {
    receive: () => Promise<ExternalReceive | undefined>;
    receiveAll: () => AsyncGenerator<Awaited<ExternalReceive> | undefined, void, any>;
    return: () => Promise<void>;
    throw: (err: any) => Promise<never>;
    send: (output: Send) => Promise<void>;
    assignReader: (reader: ChannelReaderType<ExternalReceive>) => void;
    reader: ReadableStreamDefaultReader<Receive>;
    [Symbol.asyncIterator]: AsyncChannelController<Send, Receive, ExternalReceive>["receiveAll"];
};
export function intermingledChannels<Channel1Send, Channel2Send>(): readonly [AsyncChannelController<Channel1Send, Channel1Send, Channel2Send>, AsyncChannelController<Channel2Send, Channel2Send, Channel1Send>];

//# sourceMappingURL=async-channel.d.ts.map
