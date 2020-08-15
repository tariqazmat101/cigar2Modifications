import reader from "./reader";
import writer from "./writer";

const MAXLISTLENGTH = 2000;

//todo enforce this as a singleton class
export default class replayer {
    public static clips = [];

    /* static - only exists on the class, readonly - acts like const,
    see https://stackoverflow.com/questions/37265275/how-to-implement-class-constants-in-typescript
     */
    //public static readonly MAXLISTLENGTH = 2000;


    //when you need to replay the clip
    private numOfBytes: number = NaN;
    private totalbytesRead: number = NaN;
    private bytesRemaining: number = NaN;


    private _buffer = [];
    private readIndex = 0;
    private writeIndex = 0;

    constructor() {

    }

    //todo Destroy all the class properties and make sure to append the finalbuffer to static clips
    destroy() {
    }

    get buffer(): any {
        return this._buffer;
    }


    /*todo What happens when the 'R' key is pressed?  We need to:
    1) Align the start of the buffer to the closest keyframe
    2) Add the buffer to clips array
    3) reset buffer,readIndex, and writeindex


     */


    //read index will always be writeindex + 1;
    //Key frames which have the cells, deep copied, and whatnot
    addMessagetoBuffer(obj: any): void {
        this._buffer.splice(this.writeIndex, 1, obj);
        this.writeIndex = (this.writeIndex + 1) % MAXLISTLENGTH;
    }


    //takes in an array of arraybufers, and serializes to a base64 string
    _arrayBufferToBase64(list) {
        var binary = '';
        //iterate through an arrray of arraybuffers
        for (let x = 0; x < list.length; x++) {
            let obj = list[x]; //obj = {buffer, bytelength(also an arraybuffer)

            for (const property in obj) {
                var bytes = new Uint8Array(obj[property]);
                var len = bytes.byteLength;

                for (var i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
            }

        }
        return window.btoa(binary);
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


