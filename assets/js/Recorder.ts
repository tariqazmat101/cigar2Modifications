import reader from "./reader";
import writer from "./writer";
import _ from "lodash"

const MAXLISTLENGTH = 2000;
const DRAWPACKET = 0x10;

/**
 * This is the class for the Replay Recorder. It contains
 * Each ReplayClip holds an array of dataFrames.
 * Each dataFrame is mapped to a websocket message.
 */

//lovely message
//todo enforce this as a singleton class
/**
 * dataFrame object represents a single websocket message.
 * It contains the packetId of that message, the data within that message, and it's length.
 *
 * An optional property called 'Cells' is only added to transform the dataFrame into a keyFrame.
 */
interface dataFrame extends Object {
    length: number;
    payload: ArrayBuffer;
    packetId: number;
    //frameType: 'dataFrame';
    //optional property for the type

    cells?: any;
}

//Yeah, Yeah I know. I could use 'extends'

interface clip {
    time: string;
    buffer: (dataFrame) [];
}

export default class Recorder {
    public static clips = [];
    //public static clips: clip[] = [];

    /* static - only exists on the class, readonly - acts like const,
    see https://stackoverflow.com/questions/37265275/how-to-implement-class-constants-in-typescript
     */
    //public static readonly MAXLISTLENGTH = 2000;

    //when you need to replay the clip
    private numOfBytes: number = NaN;
    private totalbytesRead: number = NaN;
    private bytesRemaining: number = NaN;
    private readIndex = 0;
    private writeIndex: number = 0;
    //denotes if the RingBuffer has done atleast 1 full cycle.
    private hasOverlapped: boolean = false;
    private drawMessageCount: number = 0;
    private time: number;

    constructor() {

    }

    private _buffer: (dataFrame)[] = [];

    //todo Destroy all the class properties and make sure to append the finalbuffer to static clips
    get buffer(): any {
        return this._buffer;
    }

    /*todo What happens when the 'R' key is pressed?  We need to:
    1) Align the start of the buffer to the closest keyframe
    2) Add the buffer to clips array
    3) reset buffer,readIndex, and writeindex */
    addtoClips(canvas) {
        //generate a thumbnail picture
        const picture = canvas.toDataURL('image/jpeg', 0.1);

        let croppedBuffer;
        for (let i = 0; i < this.buffer.length; i++) {
            if (this.buffer[i].hasOwnProperty('cells')) {
                croppedBuffer = this.buffer.splice(i);
                break;
            }
        }
        let objectx = {
            buffer: croppedBuffer,
            time: new Date().toLocaleDateString('en-us', {hour12: true}),
            thumbnail: picture
        } as clip;
        Recorder.clips.push(objectx);

        //add
        this.generateHTMLelement(objectx);
        //add all the event listeners

        //clear the buffer state,
        this._buffer = [];
        this.writeIndex = 0;
        this.drawMessageCount = 0;
        this.hasOverlapped = false;
    };

    generateHTMLelement(obj) {
        let parent = document.getElementsByClassName('replays')[0];

        let fragment = new DocumentFragment();
        let child = document.createElement('div');
        child.className = "replay-item";

        child.innerHTML += `<img src=${obj.thumbnail} class = "replay-thumbnail">
            <div class="replay-header">
        <div class = replay-name></div>
            </div>`;

        parent.appendChild(child);
    }

    //read index will always be writeindex + 1;
    //Key frames which have the cells, deep copied, and whatnot
    addMessagetoBuffer(message: dataFrame, cells: any): void {
        if (message.packetId == DRAWPACKET) {
            this.drawMessageCount++;
            if (this.drawMessageCount === 80) {
                this.drawMessageCount = 0;
                console.log(`message count is $${this.drawMessageCount}`);
                message.cells = _.cloneDeep(cells);
            }
        }

        if (message.hasOwnProperty('cells')) {
            console.log("KEYFRAME")
        }


        this._buffer.splice(this.writeIndex, 1, message);
        this.writeIndex = (this.writeIndex + 1) % MAXLISTLENGTH;
        if (!this.hasOverlapped) this.hasOverlapped = this.writeIndex == MAXLISTLENGTH - 1;
    }


    //Convert to a replay file
    //todo Re-implement this method to support keyframes, rememeber:
    //todo keyframes are not in binary; you need to convert them firs tto binary in order to convert, and then

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

    //Convert from a replay file to arraybuffers
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


