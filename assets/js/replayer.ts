import reader from "./reader";
import writer from "./writer";

export default class replayer {
    static clips = [];

    /* static - only exists on the class, readonly - acts like const,
    see https://stackoverflow.com/questions/37265275/how-to-implement-class-constants-in-typescript
     */
    public static readonly MAXLISTLENGTH = 2000;


    private buffer = [];
    private numOfBytes: number = NaN;
    private totalbytesRead: number = NaN;
    private bytesRemaining: number = NaN;


    private list = [];
    private readIndex = 0;
    private writeIndex = 0;

    constructor() {


    }

    //todo Destroy all the class properties and make sure to append the finalbuffer to static clips
    destroy() {

    }

    addtoList(obj) {
        this.list.splice(this.writeIndex, 1, obj);
        this.writeIndex = (this.writeIndex + 1) % replayer.MAXLISTLENGTH;
    }

    _base64ToArrayBuffer(base64: string) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }
}


