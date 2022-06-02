function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "intermingledChannels", () => $f4c9eda8ec870105$export$9c079b10700e891a);
async function* $f4c9eda8ec870105$var$consumeStream(stream, onExit) {
    try {
        let done, value;
        do {
            ({ done: done , value: value  } = await stream.read());
            if (done) continue;
            yield value;
        }while (!done);
    } catch (err) {
        return onExit.throw(err);
    } finally{
        return onExit.return();
    }
}
function $f4c9eda8ec870105$var$getReader(reader) {
    if (reader instanceof ReadableStreamDefaultReader) return reader;
    else if ("reader" in reader) return reader.reader;
}
/** */ function $f4c9eda8ec870105$var$AsyncChannel(reader) {
    let _reader = typeof reader === "undefined" ? undefined : $f4c9eda8ec870105$var$getReader(reader);
    // type InternalReceive = ExternalSend;
    const internalStream = new TransformStream();
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
        async receive () {
            if (!_reader) throw new Error("No reader available you must either pass in a reader at initialization or assign one later.");
            return (await _reader.read())?.value;
        },
        receiveAll: async function* receiveAll() {
            if (!_reader) throw new Error("No reader available you must either pass in a reader at initialization or assign one later.");
            yield* $f4c9eda8ec870105$var$consumeStream(_reader, this);
        },
        async return () {
            await cleanup();
        },
        async throw (err) {
            await cleanup();
            throw err;
        },
        async send (data) {
            return writer.write(data);
        },
        assignReader (newExternalReader) {
            _reader = $f4c9eda8ec870105$var$getReader(newExternalReader);
        },
        reader: internalReader,
        [Symbol.asyncIterator] () {
            return this.receiveAll();
        }
    };
}
function $f4c9eda8ec870105$export$9c079b10700e891a() {
    const controller1 = $f4c9eda8ec870105$var$AsyncChannel();
    const controller2 = $f4c9eda8ec870105$var$AsyncChannel(controller1.reader);
    controller1.assignReader(controller2.reader);
    return [
        controller1,
        controller2
    ];
}


//# sourceMappingURL=async-channel.js.map
