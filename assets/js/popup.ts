/* global window */

import {log} from "./utils";

let authWindow: Window | null = null;
const popup = (url) => {
    const windowArea: any = {
        width: Math.floor(window.outerWidth * 0.8),
        height: Math.floor(window.outerHeight * 0.5),
    };

    if (windowArea.width < 1000) {
        windowArea.width = 1000;
    }
    if (windowArea.height < 630) {
        windowArea.height = 630;
    }
    windowArea.left = Math.floor(window.screenX + ((window.outerWidth - windowArea.width) / 2));
    windowArea.top = Math.floor(window.screenY + ((window.outerHeight - windowArea.height) / 8));
    const windowOpts = `toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0,
    width=${windowArea.width},height=${windowArea.height},
    left=${windowArea.left},top=${windowArea.top}`;

    authWindow = window.open(url, 'DiscordPopUP ', windowOpts);
    const authPromise = new Promise((resolve, reject) => {
        window.addEventListener("message", (e) => {
            // if (e.origin !== "api.azma.io") {
            //   //  authWindow.close();
            //     reject(`not allowed becuase ${e.origin}`);
            //     console.log(e.origin);
            //     console.log("not allowed")
            // }


            if (e.data.auth) {
                console.log(`the code is ${e.data.auth}`);
                resolve((e.data));
                authWindow.close();
            } else {
                authWindow.close();
                reject('Unauthorised');
            }
        }, false);
    });

    const scanTimer = setInterval(() => {
        try {
            if (window.location.hostname !== "localhost") return;
        } catch (err) {

            clearInterval(scanTimer)
            console.log("we are in the clear interval stage");
            console.log(err)
            return;
        }
        if (!authWindow) return;
        if (authWindow.window.location == null) return;

        try {
            authWindow.window.location.hostname
        }
        catch (e){
            return
        }
        // @ts-ignore
        if (authWindow.window.location.hostname === HOSTNAME) {
            const params = new URLSearchParams(authWindow.window.location.search);
           const code =  params.get("code");

            authWindow.opener.postMessage({auth:code}, authWindow.opener.location);
            clearInterval(scanTimer);
            authWindow.close();
        }

    }, 100)
    return authPromise;
};
//delete this laters
export default popup;
